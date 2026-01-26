'use client';

import { Profiles, ProfilesWithRoles, Tasks } from '@/types/types';
import { columns } from './columns';
import { DataTable } from './data-table';
import TaskDialog from './task-dialog';

interface TasksClientProps {
  tasks: Tasks[];
  profiles: ProfilesWithRoles[];
}

const TasksClient: React.FC<TasksClientProps> = ({ tasks, profiles }) => {
  return (
    <div className="grid gap-3 px-4">
      {/* TOP FIRST LINE */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="ml-auto flex items-center gap-2">
          <TaskDialog profiles={profiles} />
        </div>
      </div>

      {/* TABLE */}
      <DataTable data={tasks} columns={columns} profiles={profiles} />
    </div>
  );
};

export default TasksClient;
