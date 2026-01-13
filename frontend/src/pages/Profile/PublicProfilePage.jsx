import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

import ProfileService from "../../services/profile.service"
import reviewService from "../../services/review.service"
import { useAuthStore } from "../../contexts/authStore"

import SkillBadge from "../../components/profile/SkillBadge"
import ReviewSummary from "../../components/reviews/ReviewSummary"
import ReviewList from "../../components/reviews/ReviewList"
import ReviewForm from "../../components/reviews/ReviewForm"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"

const PublicProfilePage = () => {
  const { userId } = useParams()
  const { user } = useAuthStore()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    loadProfile()
    loadReviews()
  }, [userId])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await ProfileService.getPublicProfile(userId)
      setProfile(res.data)

      if (["provider", "both"].includes(res.data.user_type)) {
        const statsRes = await ProfileService.getProviderStats(userId)
        setStats(statsRes.data)
      } else {
        const statsRes = await ProfileService.getClientStats(userId)
        setStats(statsRes.data)
      }
    } catch {
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      setReviewsLoading(true)
      const data = await reviewService.getReviews({ reviewee: userId })
      setReviews(data)
    } finally {
      setReviewsLoading(false)
    }
  }

  const isOwnProfile = user?.id === Number(userId)
  const canLeaveReview = user && !isOwnProfile
  const isProvider = profile?.user_type === "provider" || profile?.user_type === "both"

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container py-10 text-center text-muted-foreground">
        Profile not found
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT – PROFILE CARD */}
        <Card className="lg:col-span-1 sticky top-6">
          <CardContent className="pt-6 text-center space-y-4">

            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.user_full_name}
                className="w-28 h-28 mx-auto rounded-full object-cover"
              />
            ) : (
              <div className="w-28 h-28 mx-auto rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
                {profile.user_full_name?.[0] || "?"}
              </div>
            )}

            {/* Name */}
            <div>
              <h2 className="text-xl font-semibold">
                {profile.user_full_name}
              </h2>
              {profile.verified && (
                <Badge variant="success" className="mt-1">Verified</Badge>
              )}
            </div>

            {profile.headline && (
              <p className="text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}

            {profile.location && (
              <p className="text-sm text-muted-foreground">
                📍 {profile.location}
              </p>
            )}

            {isProvider && profile.hourly_rate && (
              <div className="py-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  ${profile.hourly_rate}
                </p>
                <span className="text-xs text-muted-foreground">per hour</span>
              </div>
            )}

            {profile.languages?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {profile.languages.map(lang => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                  </Badge>
                ))}
              </div>
            )}

            {profile.portfolio_url && (
              <Button asChild className="w-full">
                <a href={profile.portfolio_url} target="_blank">
                  View Portfolio
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* RIGHT – TABS */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>

            {/* ABOUT TAB */}
            <TabsContent value="about" className="space-y-6">

              {profile.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground whitespace-pre-line">
                    {profile.bio}
                  </CardContent>
                </Card>
              )}

              {profile.skills?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <SkillBadge key={skill.id} skill={skill} />
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    {Object.entries(stats).map(([key, value]) => (
                      <div key={key} className="bg-muted rounded-lg p-4">
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">
                          {key.replace(/_/g, " ")}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* REVIEWS TAB */}
            <TabsContent value="reviews" className="space-y-6">
              <ReviewSummary userId={userId} />

              {canLeaveReview && !showReviewForm && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowReviewForm(true)}>
                    Write Review
                  </Button>
                </div>
              )}

              {showReviewForm && (
                <ReviewForm
                  revieweeId={Number(userId)}
                  revieweeName={profile.user_full_name}
                  onSuccess={(r) => {
                    setReviews([r, ...reviews])
                    setShowReviewForm(false)
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewList reviews={reviews} loading={reviewsLoading} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default PublicProfilePage
