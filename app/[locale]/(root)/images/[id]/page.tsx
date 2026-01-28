import getImageProject from '@/actions/image-generator/projects/get-project';
import getImagePresets from '@/actions/image-generator/presets/get-presets';
import ProjectEditor from './components/project-editor';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { id } = await params;
  const isNew = id === 'new';

  const [project, presets] = await Promise.all([
    isNew ? Promise.resolve(null) : getImageProject(id),
    getImagePresets(),
  ]);

  return <ProjectEditor project={project} presets={presets} isNew={isNew} />;
};

export default ProjectPage;
