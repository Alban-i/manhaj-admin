import getTasks from '@/actions/get-tasks';
import getAuthors from '@/actions/get-authors';
import TasksClient from './(tasks)/components/tasks-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const tasks = await getTasks();
  const profiles = await getAuthors();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <TasksClient tasks={tasks} profiles={profiles} />
    </div>
  );
}
