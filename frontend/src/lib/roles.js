export const ROLES = {
  ADMIN: "admin",
  PROPOSAL_MANAGER: "proposal_manager",
  REVIEWER: "reviewer",
  WRITER: "writer",
};

export const ROLE_ACCESS = {
  admin: ["admin", "proposal_manager", "reviewer", "writer"],
  proposal_manager: ["proposal_manager", "reviewer", "writer"],
  reviewer: ["reviewer"],
  writer: ["writer"],
};
