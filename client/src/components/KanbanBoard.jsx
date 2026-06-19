import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useGetJobsQuery, useUpdateJobStatusMutation } from '../store/api'
import '../styles/kanban.css'

const COLUMNS = [
  { id: 'saved', title: 'Saved', color: 'var(--color-text-muted)' },
  { id: 'applied', title: 'Applied', color: 'var(--color-info)' },
  { id: 'interview', title: 'Interviewing', color: 'var(--color-primary)' },
  { id: 'offer', title: 'Offer', color: 'var(--color-success)' },
  { id: 'rejected', title: 'Rejected', color: 'var(--color-error)' }
]

function SortableJobCard({ job }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job._id, data: job })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="job-company">{job.company}</div>
      <div className="job-role">{job.role}</div>
      <div className="job-meta">
        <span className="job-date">{new Date(job.updatedAt).toLocaleDateString()}</span>
        {job.matchScore && <span className="job-match-score">{job.matchScore}% Match</span>}
      </div>
    </div>
  )
}

function KanbanColumn({ column, jobs }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column }
  })

  return (
    <div className="kanban-column">
      <div className="kanban-column-header" style={{ borderBottomColor: column.color }}>
        {column.title}
        <span className="kanban-column-count">{jobs.length}</span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`kanban-droppable-area ${isOver ? 'is-over' : ''}`}
      >
        <SortableContext 
          items={jobs.map(j => j._id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map(job => (
            <SortableJobCard key={job._id} job={job} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const { data, isLoading } = useGetJobsQuery()
  const [updateStatus] = useUpdateJobStatusMutation()
  
  const [localJobs, setLocalJobs] = useState([])
  const [activeJob, setActiveJob] = useState(null)

  useEffect(() => {
    if (data?.jobs) {
      setLocalJobs(data.jobs)
    }
  }, [data?.jobs])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before drag starts (helps click vs drag)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    const { active } = event
    const job = localJobs.find(j => j._id === active.id)
    setActiveJob(job)
  }

  const handleDragOver = (event) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeJob = localJobs.find(j => j._id === activeId)
    if (!activeJob) return

    const overColumnId = COLUMNS.find(c => c.id === overId)?.id
    const isOverAColumn = !!overColumnId
    
    // If dropping over a column directly
    if (isOverAColumn) {
      if (activeJob.status !== overColumnId) {
        setLocalJobs(prev => prev.map(job => 
          job._id === activeId ? { ...job, status: overColumnId } : job
        ))
      }
      return
    }

    // If dropping over another card
    const overJob = localJobs.find(j => j._id === overId)
    if (overJob && activeJob.status !== overJob.status) {
      setLocalJobs(prev => prev.map(job => 
        job._id === activeId ? { ...job, status: overJob.status } : job
      ))
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveJob(null)

    if (!over) return

    const activeId = active.id
    const job = localJobs.find(j => j._id === activeId)
    
    // Get the original job from RTK Query cache to see if status actually changed
    const originalJob = data?.jobs?.find(j => j._id === activeId)

    if (job && originalJob && job.status !== originalJob.status) {
      try {
        // Persist to backend
        await updateStatus({ id: job._id, status: job.status }).unwrap()
      } catch (err) {
        console.error('Failed to update job status:', err)
        // Revert local state on failure
        setLocalJobs(data.jobs)
      }
    }
  }

  if (isLoading) return <div className="skeleton" style={{ height: '400px', width: '100%' }} />

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-container">
        {COLUMNS.map(col => {
          const columnJobs = localJobs.filter(j => j.status === col.id)
          return <KanbanColumn key={col.id} column={col} jobs={columnJobs} />
        })}
      </div>

      <DragOverlay>
        {activeJob ? (
          <div className="kanban-card is-dragging" style={{ cursor: 'grabbing' }}>
            <div className="job-company">{activeJob.company}</div>
            <div className="job-role">{activeJob.role}</div>
            <div className="job-meta">
              <span className="job-date">{new Date(activeJob.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
