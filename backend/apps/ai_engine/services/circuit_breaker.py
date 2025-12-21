"""
Circuit Breaker Pattern Implementation

Prevents cascading failures by temporarily disabling calls to
failing AI providers. Automatically recovers when the provider
becomes healthy again.
"""

import logging
import time
from typing import Callable, Any, Optional
from enum import Enum
from threading import Lock
from dataclasses import dataclass, field
from functools import wraps

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """States of the circuit breaker."""
    CLOSED = "closed"      # Normal operation, requests pass through
    OPEN = "open"          # Failures detected, requests are blocked
    HALF_OPEN = "half_open"  # Testing if service has recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""
    failure_threshold: int = 5        # Failures before opening circuit
    success_threshold: int = 2        # Successes in half-open before closing
    timeout: float = 60.0             # Seconds to wait before trying half-open
    half_open_max_calls: int = 3      # Max calls in half-open state


@dataclass
class CircuitStats:
    """Statistics for circuit breaker."""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    last_failure_time: Optional[float] = None
    last_state_change: float = field(default_factory=time.time)


class CircuitBreaker:
    """
    Circuit breaker for AI providers.
    
    States:
    - CLOSED: Normal operation, all requests pass through
    - OPEN: Too many failures, all requests are rejected immediately
    - HALF_OPEN: Testing recovery, limited requests allowed
    
    Usage:
        breaker = CircuitBreaker("openai")
        
        @breaker
        def call_openai(prompt):
            return openai_client.generate(prompt)
    """
    
    # Class-level storage for all circuit breakers
    _breakers: dict = {}
    _lock = Lock()
    
    def __init__(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None,
    ):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self._state = CircuitState.CLOSED
        self._stats = CircuitStats()
        self._state_lock = Lock()
        self._half_open_calls = 0
        
        # Register this breaker
        with CircuitBreaker._lock:
            CircuitBreaker._breakers[name] = self
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state, potentially transitioning from OPEN to HALF_OPEN."""
        with self._state_lock:
            if self._state == CircuitState.OPEN:
                # Check if we should transition to half-open
                if self._stats.last_failure_time:
                    elapsed = time.time() - self._stats.last_failure_time
                    if elapsed >= self.config.timeout:
                        self._transition_to(CircuitState.HALF_OPEN)
            
            return self._state
    
    def _transition_to(self, new_state: CircuitState) -> None:
        """Transition to a new state."""
        old_state = self._state
        self._state = new_state
        self._stats.last_state_change = time.time()
        
        if new_state == CircuitState.HALF_OPEN:
            self._half_open_calls = 0
            self._stats.consecutive_successes = 0
        
        logger.info(
            f"Circuit breaker '{self.name}' transitioned: {old_state.value} -> {new_state.value}"
        )
    
    def record_success(self) -> None:
        """Record a successful call."""
        with self._state_lock:
            self._stats.total_calls += 1
            self._stats.successful_calls += 1
            self._stats.consecutive_failures = 0
            self._stats.consecutive_successes += 1
            
            # Check if we should close the circuit
            if self._state == CircuitState.HALF_OPEN:
                if self._stats.consecutive_successes >= self.config.success_threshold:
                    self._transition_to(CircuitState.CLOSED)
    
    def record_failure(self) -> None:
        """Record a failed call."""
        with self._state_lock:
            self._stats.total_calls += 1
            self._stats.failed_calls += 1
            self._stats.consecutive_failures += 1
            self._stats.consecutive_successes = 0
            self._stats.last_failure_time = time.time()
            
            # Check if we should open the circuit
            if self._state == CircuitState.CLOSED:
                if self._stats.consecutive_failures >= self.config.failure_threshold:
                    self._transition_to(CircuitState.OPEN)
            
            elif self._state == CircuitState.HALF_OPEN:
                # Single failure in half-open returns to open
                self._transition_to(CircuitState.OPEN)
    
    def can_execute(self) -> bool:
        """Check if a call is allowed."""
        current_state = self.state  # This may trigger OPEN -> HALF_OPEN
        
        if current_state == CircuitState.CLOSED:
            return True
        
        if current_state == CircuitState.HALF_OPEN:
            with self._state_lock:
                if self._half_open_calls < self.config.half_open_max_calls:
                    self._half_open_calls += 1
                    return True
                return False
        
        # State is OPEN
        return False
    
    def __call__(self, func: Callable) -> Callable:
        """Use circuit breaker as a decorator."""
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            if not self.can_execute():
                raise CircuitOpenError(
                    f"Circuit breaker '{self.name}' is open. "
                    f"Service temporarily unavailable."
                )
            
            try:
                result = func(*args, **kwargs)
                self.record_success()
                return result
            except Exception as e:
                self.record_failure()
                raise
        
        return wrapper
    
    def get_stats(self) -> dict:
        """Get circuit breaker statistics."""
        return {
            'name': self.name,
            'state': self.state.value,
            'total_calls': self._stats.total_calls,
            'successful_calls': self._stats.successful_calls,
            'failed_calls': self._stats.failed_calls,
            'consecutive_failures': self._stats.consecutive_failures,
            'consecutive_successes': self._stats.consecutive_successes,
            'failure_rate': (
                self._stats.failed_calls / self._stats.total_calls
                if self._stats.total_calls > 0 else 0
            ),
        }
    
    def reset(self) -> None:
        """Reset the circuit breaker."""
        with self._state_lock:
            self._state = CircuitState.CLOSED
            self._stats = CircuitStats()
            self._half_open_calls = 0
        logger.info(f"Circuit breaker '{self.name}' has been reset")
    
    @classmethod
    def get_breaker(cls, name: str) -> Optional['CircuitBreaker']:
        """Get a circuit breaker by name."""
        return cls._breakers.get(name)
    
    @classmethod
    def get_all_stats(cls) -> dict:
        """Get stats for all circuit breakers."""
        return {
            name: breaker.get_stats()
            for name, breaker in cls._breakers.items()
        }


class CircuitOpenError(Exception):
    """Exception raised when circuit is open."""
    pass


# Pre-configured circuit breakers for common providers
openai_circuit = CircuitBreaker(
    "openai",
    CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=2,
        timeout=60.0,
    )
)

anthropic_circuit = CircuitBreaker(
    "anthropic",
    CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=2,
        timeout=60.0,
    )
)
