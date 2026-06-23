import { motion } from 'framer-motion'
import { useGetDashboardEventsQuery } from '../store/api'

export default function DashboardCalendarWidget() {
  const { data, isLoading } = useGetDashboardEventsQuery()

  if (isLoading) {
    return <div className="skeleton" style={{ height: '200px', borderRadius: '1rem' }} />
  }

  const events = data?.events || []

  return (
    <div className="calendar-widget glass-card" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="widget-title" style={{ margin: 0, fontSize: '1rem' }}>Upcoming Interviews</h3>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-primary-light)', cursor: 'pointer' }}>View all</span>
      </div>
      <div className="calendar-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events.slice(0, 4).map((event, i) => {
          const startDate = new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          
          return (
            <motion.div 
              key={event.id}
              className="calendar-item"
              style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="calendar-date-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--color-surface-2)', padding: '0.5rem', borderRadius: '0.5rem', minWidth: '60px' }}>
                <span className="cal-month" style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textTransform: 'uppercase', fontWeight: 600 }}>{startDate.split(' ')[0]}</span>
                <span className="cal-day" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{startDate.split(' ')[1]}</span>
              </div>
              <div className="calendar-info" style={{ flex: 1 }}>
                <h4 className="cal-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{event.title}</h4>
                <p className="cal-desc" style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{event.description}</p>
                <span className={`cal-type badge badge-${event.type === 'drive' ? 'primary' : 'success'}`} style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem' }}>
                  {event.type.replace('_', ' ')}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
