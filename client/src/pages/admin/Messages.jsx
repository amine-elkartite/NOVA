import {
  Archive,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  MoreVertical,
  Package,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import AdminHeader from '../../components/layout/AdminHeader.jsx'
import AdminSidebar from '../../components/layout/AdminSidebar.jsx'
import {
  createMessageConversation,
  getAdminApiErrorMessages,
  getMessageConversations,
  sendMessage as sendMessageRequest,
  updateMessageConversation,
  uploadAdminImages,
} from '../../services/adminService.js'

const tabs = [
  ['all', 'Tous'],
  ['unread', 'Non lus'],
  ['pending', 'En attente'],
  ['resolved', 'Resolus'],
]

function MessageStatCard({
  icon: Icon,
  label,
  value,
  detail,
  danger = false,
}) {
  return (
    <div className="messages-stat-card">
      <div className="messages-stat-card__icon">
        <Icon size={28} strokeWidth={1.65} />
      </div>

      <div className="messages-stat-card__content">
        <span>{label}</span>

        <div className="messages-stat-card__value-row">
          <strong>{value}</strong>

          <small
            className={`messages-stat-card__change ${
              danger ? 'is-danger' : ''
            }`}
          >
            {detail}
          </small>
        </div>

        <em>Base support</em>
      </div>
    </div>
  )
}

function Avatar({
  src,
  initials,
  alt,
  className = '',
}) {
  return (
    <div className={`messages-avatar ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <span>{initials}</span>
    </div>
  )
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('fr-FR')
}

function buildStats(nextConversations) {
  return {
    total: nextConversations.length,
    unread: nextConversations.reduce(
      (total, conversation) =>
        total + Number(conversation.unread || 0),
      0,
    ),
    active: nextConversations.filter(
      (conversation) =>
        !['resolved', 'archived'].includes(conversation.status),
    ).length,
    pending: nextConversations.filter(
      (conversation) => conversation.status === 'pending',
    ).length,
  }
}

function getRecentActivity(conversation) {
  const activities = []

  if (conversation.order && conversation.order !== 'Sans commande') {
    activities.push({
      icon: ShoppingCart,
      title: conversation.order,
      time: conversation.time || 'Base support',
    })
  }

  if (conversation.preview) {
    activities.push({
      icon: MessageCircle,
      title: 'Dernier message',
      time: conversation.time || 'Base support',
    })
  }

  if (conversation.orderCount > 0) {
    activities.push({
      icon: ShoppingBag,
      title: `${formatNumber(conversation.orderCount)} commandes client`,
      time: conversation.customerSince || 'Client',
    })
  }

  if (activities.length > 0) {
    return activities
  }

  return [
    {
      icon: MessageCircle,
      title: 'Aucune activite client',
      time: 'Base support',
    },
  ]
}

export default function Messages() {
  const attachmentInputRef = useRef(null)
  const [conversations, setConversations] = useState([])
  const [stats, setStats] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadConversations() {
      setLoading(true)

      try {
        const data = await getMessageConversations()

        if (isActive) {
          setConversations(data.conversations)
          setStats(data.stats || {})
          setSelectedId((currentId) =>
            currentId ||
            data.conversations.find(
              (conversation) => conversation.status !== 'archived',
            )?.id ||
            null,
          )
        }
      } catch (error) {
        if (isActive) {
          setNotice(getAdminApiErrorMessages(error).join(' '))
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadConversations()

    return () => {
      isActive = false
    }
  }, [])

  const replaceConversation = (nextConversation) => {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === nextConversation.id
          ? nextConversation
          : conversation,
      ),
    )
  }

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return conversations.filter((conversation) => {
      const matchesTab =
        (activeTab === 'all' && conversation.status !== 'archived') ||
        (activeTab === 'unread' && conversation.unread > 0) ||
        (activeTab === 'pending' &&
          conversation.status === 'pending') ||
        (activeTab === 'resolved' &&
          conversation.status === 'resolved')
      const matchesSearch =
        !normalizedSearch ||
        String(conversation.name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(conversation.preview || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(conversation.order || '')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesTab && matchesSearch
    })
  }, [activeTab, conversations, searchTerm])

  const availableConversations = conversations.filter(
    (conversation) => conversation.status !== 'archived',
  )
  const selectedConversation =
    availableConversations.find(
      (conversation) => conversation.id === selectedId,
    ) ?? filteredConversations[0] ?? availableConversations[0] ?? null

  const selectConversation = async (conversationId) => {
    setSelectedId(conversationId)

    const selectedConversationData = conversations.find(
      (conversation) => conversation.id === conversationId,
    )

    if (!selectedConversationData || selectedConversationData.unread === 0) {
      return
    }

    try {
      const nextConversation = await updateMessageConversation(
        conversationId,
        {
          read: true,
        },
      )

      const nextConversations = conversations.map((conversation) =>
          conversation.id === conversationId
            ? nextConversation
            : conversation,
      )

      setConversations(nextConversations)
      setStats(buildStats(nextConversations))
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const sendMessage = async () => {
    const text = draft.trim()

    if (!text || !selectedConversation || isSending) {
      return
    }

    setIsSending(true)

    try {
      const nextConversation = await sendMessageRequest(
        selectedConversation.id,
        text,
        attachmentUrl || null,
      )

      replaceConversation(nextConversation)
      setDraft('')
      setAttachmentUrl('')
      setNotice('Reponse envoyee en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    } finally {
      setIsSending(false)
    }
  }

  const markResolved = async () => {
    if (!selectedConversation) {
      return
    }

    try {
      const nextConversation = await updateMessageConversation(
        selectedConversation.id,
        {
          status: 'resolved',
          read: true,
        },
      )

      replaceConversation(nextConversation)
      setNotice('Conversation marquee comme resolue.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const startNewConversation = async () => {
    const subject = window.prompt('Sujet de la conversation')

    if (!subject?.trim()) {
      return
    }

    const message =
      window.prompt('Premier message admin') ||
      'Bonjour, comment pouvons-nous vous aider ?'

    try {
      const nextConversation = await createMessageConversation({
        subject: subject.trim(),
        message,
        status: 'open',
      })

      setConversations((currentConversations) => [
        nextConversation,
        ...currentConversations,
      ])
      setSelectedId(nextConversation.id)
      setDraft('')
      setNotice('Nouvelle conversation creee en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const archiveConversation = async () => {
    if (!selectedConversation) {
      return
    }

    try {
      const nextConversation = await updateMessageConversation(
        selectedConversation.id,
        {
          status: 'archived',
          read: true,
        },
      )

      const nextConversations = conversations.map((conversation) =>
          conversation.id === selectedConversation.id
            ? nextConversation
            : conversation,
      )
      const nextVisible = nextConversations.find(
        (conversation) => conversation.status !== 'archived',
      )

      setConversations(nextConversations)
      setSelectedId(nextVisible?.id || null)
      setStats(buildStats(nextConversations))
      setNotice('Conversation archivee en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const attachFile = async (event) => {
    const [file] = Array.from(event.target.files || [])

    if (!file) {
      return
    }

    try {
      const [uploadedImage] = await uploadAdminImages([file], 'messages')

      if (uploadedImage) {
        setAttachmentUrl(uploadedImage.image_url)
        setDraft((currentDraft) =>
          currentDraft ||
          `Piece jointe: ${uploadedImage.image_url}`,
        )
        setNotice('Piece jointe envoyee au serveur.')
      }
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    } finally {
      event.target.value = ''
    }
  }

  const addEmoji = () => {
    setDraft((currentDraft) => `${currentDraft}${currentDraft ? ' ' : ''}:)`)
  }

  const addTag = async () => {
    if (!selectedConversation) {
      return
    }

    const tag = window.prompt('Nouveau tag client')

    if (!tag?.trim()) {
      return
    }

    try {
      const nextTags = Array.from(
        new Set([...selectedConversation.tags, tag.trim()]),
      )
      const nextConversation = await updateMessageConversation(
        selectedConversation.id,
        {
          tags: nextTags,
        },
      )

      replaceConversation(nextConversation)
      setNotice('Tag ajoute en base.')
    } catch (error) {
      setNotice(getAdminApiErrorMessages(error).join(' '))
    }
  }

  const showCustomerActions = () => {
    if (selectedConversation) {
      setNotice(
        `Client selectionne : ${selectedConversation.name}.`,
      )
    }
  }

  const activity = selectedConversation
    ? getRecentActivity(selectedConversation)
    : []

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-main">
        <AdminHeader />

        <main className="admin-dashboard messages-page">
          <section className="messages-page__breadcrumb">
            <span>Accueil</span>
            <ChevronRight size={14} strokeWidth={1.7} />
            <strong>Messages</strong>
          </section>

          <section className="messages-page__heading">
            <div>
              <h1>Gestion des messages</h1>

              <p>
                Consultez et gerez les conversations clients en base.
              </p>
            </div>

            <button
              className="messages-primary-button"
              type="button"
              onClick={startNewConversation}
            >
              <Plus size={18} strokeWidth={1.8} />
              <span>Nouveau message</span>
            </button>
          </section>

          <section className="messages-stats">
            <MessageStatCard
              icon={MessageCircle}
              label="Conversations"
              value={formatNumber(stats.total)}
              detail="Total"
            />

            <MessageStatCard
              icon={Mail}
              label="Non lus"
              value={formatNumber(stats.unread)}
              detail="A traiter"
              danger
            />

            <MessageStatCard
              icon={Users}
              label="Actives"
              value={formatNumber(stats.active)}
              detail="Ouvertes"
            />

            <MessageStatCard
              icon={Clock3}
              label="En attente"
              value={formatNumber(stats.pending)}
              detail="Pending"
            />
          </section>

          {loading ? (
            <p className="admin-local-notice">Chargement des conversations...</p>
          ) : null}

          {notice ? <p className="admin-local-notice">{notice}</p> : null}

          <section className="messages-workspace">
            <aside className="dashboard-card messages-list-panel">
              <div className="messages-tabs">
                {tabs.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      activeTab === value ? 'is-active' : ''
                    }
                    onClick={() => setActiveTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="messages-search">
                <Search size={18} strokeWidth={1.7} />
                <input
                  type="search"
                  value={searchTerm}
                  placeholder="Rechercher un message..."
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

              <div className="messages-conversation-list">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`messages-conversation ${
                      selectedConversation?.id === conversation.id
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() =>
                      selectConversation(conversation.id)
                    }
                  >
                    <Avatar
                      src={conversation.avatar}
                      initials={conversation.initials}
                      alt={conversation.name}
                    />

                    <span className="messages-conversation__main">
                      <strong>{conversation.name}</strong>
                      <em>{conversation.preview}</em>
                    </span>

                    <span className="messages-conversation__meta">
                      <span>{conversation.time}</span>
                      {conversation.unread > 0 ? (
                        <strong>{conversation.unread}</strong>
                      ) : null}
                    </span>
                  </button>
                ))}

                {!loading && filteredConversations.length === 0 ? (
                  <p className="admin-local-notice">
                    Aucune conversation trouvee.
                  </p>
                ) : null}
              </div>
            </aside>

            {selectedConversation ? (
              <>
                <section className="dashboard-card messages-chat-panel">
                  <header className="messages-chat-header">
                    <div className="messages-chat-header__profile">
                      <Avatar
                        src={selectedConversation.avatar}
                        initials={selectedConversation.initials}
                        alt={selectedConversation.name}
                        className="messages-avatar--large"
                      />

                      <div>
                        <div className="messages-chat-header__title">
                          <h2>{selectedConversation.name}</h2>
                          {selectedConversation.online ? (
                            <span>
                              <i />
                              En ligne
                            </span>
                          ) : null}
                        </div>

                        <p>
                          {selectedConversation.order}
                          <span />
                          {selectedConversation.customerSince}
                        </p>
                      </div>
                    </div>

                    <div className="messages-chat-actions">
                      <button type="button" onClick={archiveConversation}>
                        <Archive size={17} strokeWidth={1.7} />
                        <span>Archiver</span>
                      </button>

                      <button
                        className="is-primary"
                        type="button"
                        onClick={markResolved}
                      >
                        <Check size={17} strokeWidth={1.8} />
                        <span>Marquer resolu</span>
                      </button>
                    </div>
                  </header>

                  <div className="messages-chat-body">
                    <div className="messages-day-divider">
                      Conversation
                    </div>

                    {selectedConversation.messages.map((message) => (
                      <div
                        className={`messages-chat-message messages-chat-message--${message.sender}`}
                        key={message.id}
                      >
                        {message.sender === 'customer' ? (
                          <Avatar
                            src={selectedConversation.avatar}
                            initials={selectedConversation.initials}
                            alt={selectedConversation.name}
                            className="messages-avatar--tiny"
                          />
                        ) : null}

                        <div className="messages-bubble-wrap">
                          <div className="messages-bubble">
                            {message.text
                              .split('\n')
                              .map((line, index) => (
                                <span key={`${message.id}-${index}`}>
                                  {line || '\u00a0'}
                                </span>
                              ))}
                            {message.attachmentUrl ? (
                              <a
                                href={message.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Piece jointe
                              </a>
                            ) : null}
                          </div>

                          <div className="messages-message-time">
                            {message.time}
                            {message.sender === 'admin' &&
                            message.read ? (
                              <CheckCheck
                                size={14}
                                strokeWidth={1.8}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="messages-composer">
                    <button
                      type="button"
                      aria-label="Joindre un fichier"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <Paperclip size={19} strokeWidth={1.8} />
                    </button>
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={attachFile}
                    />

                    <div className="messages-composer__input">
                      <input
                        type="text"
                        value={draft}
                        placeholder="Ecrire votre reponse..."
                        onChange={(event) =>
                          setDraft(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            sendMessage()
                          }
                        }}
                      />

                      <button
                        className="messages-composer__emoji"
                        type="button"
                        aria-label="Ajouter une reaction"
                        onClick={addEmoji}
                      >
                        <Smile size={19} strokeWidth={1.7} />
                      </button>
                    </div>

                    <button
                      className="messages-send-button"
                      type="button"
                      aria-label="Envoyer le message"
                      onClick={sendMessage}
                      disabled={isSending}
                    >
                      <Send size={19} strokeWidth={1.8} />
                    </button>
                  </footer>
                </section>

                <aside className="dashboard-card messages-detail-panel">
                  <div className="messages-detail-heading">
                    <h2>Details du client</h2>
                    <button
                      type="button"
                      aria-label="Plus d options"
                      onClick={showCustomerActions}
                    >
                      <MoreVertical size={18} strokeWidth={1.8} />
                    </button>
                  </div>

                  <div className="messages-customer-card">
                    <Avatar
                      src={selectedConversation.avatar}
                      initials={selectedConversation.initials}
                      alt={selectedConversation.name}
                      className="messages-avatar--xl"
                    />

                    <div>
                      <strong>{selectedConversation.name}</strong>

                      <span>
                        <Mail size={14} />
                        {selectedConversation.email || 'Email non renseigne'}
                      </span>

                      <span>
                        <Phone size={14} />
                        {selectedConversation.phone || 'Telephone non renseigne'}
                      </span>

                      <span>
                        <MapPin size={14} />
                        {selectedConversation.location || 'Localisation non renseignee'}
                      </span>
                    </div>
                  </div>

                  <div className="messages-customer-metrics">
                    <div>
                      <ShoppingCart size={22} strokeWidth={1.7} />
                      <span>Total de commandes</span>
                      <strong>
                        {formatNumber(selectedConversation.orderCount)}
                      </strong>
                    </div>

                    <div>
                      <Package size={22} strokeWidth={1.7} />
                      <span>Total depense</span>
                      <strong>{selectedConversation.spent}</strong>
                    </div>
                  </div>

                  <div className="messages-tags">
                    <div>
                      <h3>Tags</h3>
                      <button type="button" onClick={addTag}>
                        + Ajouter un tag
                      </button>
                    </div>

                    <div className="messages-tags__list">
                      {selectedConversation.tags.map((tag) => (
                        <span
                          className={
                            tag === 'VIP' ? 'is-vip' : ''
                          }
                          key={tag}
                        >
                          {tag === 'VIP' ? <i /> : null}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="messages-activity">
                    <h3>Activite recente</h3>

                    <div className="messages-activity__list">
                      {activity.map((item) => {
                        const Icon = item.icon

                        return (
                          <div key={`${item.title}-${item.time}`}>
                            <span className="messages-activity__dot" />

                            <div className="messages-activity__icon">
                              <Icon size={20} strokeWidth={1.7} />
                            </div>

                            <div>
                              <strong>{item.title}</strong>
                              <span>{item.time}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </aside>
              </>
            ) : (
              <section className="dashboard-card messages-chat-panel">
                <div className="messages-chat-body">
                  <div className="messages-day-divider">
                    Aucune conversation selectionnee
                  </div>
                </div>
              </section>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
