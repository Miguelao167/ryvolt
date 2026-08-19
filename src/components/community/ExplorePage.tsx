'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Gamepad2,
  Code,
  Music,
  BookOpen,
  Palette,
  MessageCircle,
  Users,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, CommunityCardSkeleton } from '@/components/ui'
import type { Community } from '@/types'

const categories = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'technology', label: 'Technology', icon: Code },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'creators', label: 'Creators', icon: Palette },
  { id: 'community', label: 'Community', icon: MessageCircle },
] as const

interface ExplorePageProps {
  communities?: Community[]
  isLoading?: boolean
  onJoinCommunity?: (communityId: string) => void
}

export function ExplorePage({ communities = [], isLoading, onJoinCommunity }: ExplorePageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-discord-bg">
      {/* Header */}
      <div className="border-b border-discord-deep bg-discord-surface">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Explore Communities
          </h1>
          <p className="text-discord-text-muted mb-6">
            Discover and join communities that match your interests
          </p>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-discord-text-dim" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-discord-bg border border-discord-deep text-white placeholder:text-discord-text-dim focus:outline-none focus:border-discord-blurple"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-discord-deep bg-discord-surface/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
                  selectedCategory === category.id
                    ? 'bg-discord-blurple text-white'
                    : 'bg-discord-surface text-discord-text-muted hover:bg-discord-hover'
                )}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Results count */}
        <p className="text-sm text-discord-text-dim mb-6">
          {filteredCommunities.length} community{filteredCommunities.length !== 1 ? 'ies' : ''} found
        </p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <CommunityCardSkeleton key={i} />
            ))
          ) : filteredCommunities.length > 0 ? (
            filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={community}
                onJoin={() => onJoinCommunity?.(community.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Users className="w-16 h-16 mx-auto text-discord-text-dim mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No communities found
              </h3>
              <p className="text-discord-text-muted">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CommunityCardProps {
  community: Community
  onJoin: () => void
}

function CommunityCard({ community, onJoin }: CommunityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl bg-discord-surface border border-discord-deep overflow-hidden transition-all hover:border-discord-blurple/50"
    >
      {/* Banner */}
      <div className="h-24 bg-gradient-to-br from-discord-blurple to-discord-green relative">
        {community.bannerUrl && (
          <img
            src={community.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-discord-surface to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4 -mt-8 relative">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-discord-surface border-4 border-discord-surface shadow-lg flex items-center justify-center">
          {community.iconUrl ? (
            <img
              src={community.iconUrl}
              alt={community.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-white">
              {community.name[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-3">
          <h3 className="font-semibold text-white truncate">
            {community.name}
          </h3>
          <p className="text-sm text-discord-text-muted line-clamp-2 mt-1 min-h-[2.5rem]">
            {community.description || 'No description'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-discord-text-dim">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {community.memberCount?.toLocaleString() || 0} members
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-discord-green" />
            {community.onlineCount || 0} online
          </div>
        </div>

        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 rounded-md bg-discord-surface/80 backdrop-blur text-xs font-medium text-discord-text-muted capitalize">
            {community.category}
          </span>
        </div>

        {/* Join button */}
        <Button
          className="w-full mt-4"
          onClick={onJoin}
        >
          Join Community
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  )
}
