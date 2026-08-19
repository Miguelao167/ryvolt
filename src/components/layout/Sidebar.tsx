'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CommunityAvatar } from '@/components/ui'
import { CommunityContextMenu } from '@/components/community/CommunityContextMenu'
import type { Community } from '@/types'

interface SidebarProps {
  communities: Community[]
  currentCommunityId?: string
  currentUserId?: string
  ownerIds?: Record<string, string>
  onSelectCommunity: (community: Community) => void
  onCreateCommunity: () => void
  onExplore: () => void
  onLeaveCommunity: (communityId: string) => void
  onOpenDM?: () => void
  dmActive?: boolean
}

export function Sidebar({
  communities,
  currentCommunityId,
  currentUserId,
  ownerIds,
  onSelectCommunity,
  onCreateCommunity,
  onExplore,
  onLeaveCommunity,
  onOpenDM,
  dmActive,
}: SidebarProps) {
  const [menu, setMenu] = useState<{
    community: Community
    x: number
    y: number
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, community: Community) => {
    e.preventDefault()
    setMenu({ community, x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div className="w-[72px] h-full bg-discord-deep flex flex-col items-center py-3 gap-2">
        {/* Home button - Discord style */}
        <HomeButton active={dmActive} onClick={() => onOpenDM?.()} />

        <div className="w-8 h-0.5 bg-discord-darker rounded-full my-1" />

        {/* Community list */}
        <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto scrollbar-hide">
          {communities.map((community) => (
            <CommunityItem
              key={community.id}
              community={community}
              isActive={community.id === currentCommunityId}
              onClick={() => onSelectCommunity(community)}
              onContextMenu={(e) => handleContextMenu(e, community)}
            />
          ))}
        </div>

        {/* Create and explore buttons */}
        <CreateButton onClick={onCreateCommunity} />
        <ExploreButton onClick={onExplore} />
      </div>

      {/* Context menu */}
      {menu && (
        <CommunityContextMenu
          community={menu.community}
          position={{ x: menu.x, y: menu.y }}
          isOwner={ownerIds?.[menu.community.id] === currentUserId}
          onClose={() => setMenu(null)}
          onLeave={onLeaveCommunity}
        />
      )}
    </>
  )
}

function HomeButton({ onClick, active }: { onClick?: () => void; active?: boolean }) {
  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        title="Mensagens diretas"
        className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all duration-200',
          active
            ? 'rounded-xl bg-discord-blurple'
            : 'bg-discord-blurple hover:rounded-xl',
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </motion.button>
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1 h-7 bg-white rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </div>
  )
}

interface CommunityItemProps {
  community: Community
  isActive: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function CommunityItem({ community, isActive, onClick, onContextMenu }: CommunityItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      animate={{ width: isActive || isHovered ? 64 : 48 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={cn(
          'w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-200',
          isActive
            ? 'bg-discord-blurple rounded-xl'
            : 'bg-discord-bg hover:bg-discord-blurple hover:rounded-xl'
        )}
      >
        <CommunityAvatar
          src={community.iconUrl}
          name={community.name}
          size="md"
        />
      </motion.button>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1 h-7 bg-white rounded-r-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-md bg-black text-white text-sm font-medium whitespace-nowrap shadow-lg"
          >
            {community.name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CreateButton({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      animate={{ width: isHovered ? 64 : 48 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-full h-12 rounded-2xl bg-discord-bg hover:bg-discord-green hover:text-discord-bg hover:rounded-xl flex items-center justify-center text-discord-green text-2xl transition-all duration-200"
      >
        +
      </motion.button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-md bg-black text-white text-sm font-medium whitespace-nowrap shadow-lg"
          >
            Criar comunidade
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ExploreButton({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      animate={{ width: isHovered ? 64 : 48 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="w-full h-12 rounded-2xl bg-discord-bg hover:bg-discord-blurple hover:rounded-xl flex items-center justify-center text-discord-green hover:text-white transition-all duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 rounded-md bg-black text-white text-sm font-medium whitespace-nowrap shadow-lg"
          >
            Explorar
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
