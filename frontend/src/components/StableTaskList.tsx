import React from "react";
import { TaskList } from "./TaskList";

interface StableTaskListProps {
  tripId: string;
  onTaskAdded?: () => void;
}

export function StableTaskList({ tripId, onTaskAdded }: StableTaskListProps) {
  return (
    <div className="stable-task-list-container">
      <TaskList tripId={tripId} onTaskAdded={onTaskAdded} />
    </div>
  );
}
