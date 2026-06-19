import { motion } from 'framer-motion'
import { useGetDashboardEventsQuery } from '../store/api'

export default function DashboardCalendarWidget() {
  const { data, isLoading } = useGetDashboardEventsQuery()

  if (isLoading) {
    return <div className="skeleton" style={{ height: '200px', borderRadius: '1rem' }} />
  }

  const events = data?.events || []

  return (
    <div className="calendar-widget">
      <h3 className="widget-title">Upcoming Hiring Events</h3>
      <div className="calendar-list">
        {events.slice(0, 4).map((event, i) => {
          const startDate = new Date(event.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
          
          return (
            <motion.div 
              key={event.id}
              className="calendar-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="calendar-date-box">
                <span className="cal-month">{startDate.split(' ')[0]}</span>
                <span className="cal-day">{startDate.split(' ')[1]}</span>
              </div>
              <div className="calendar-info">
                <h4 className="cal-title">{event.title}</h4>
                <p className="cal-desc">{event.description}</p>
                <span className={`cal-type badge badge-${event.type === 'drive' ? 'primary' : 'success'}`}>
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
