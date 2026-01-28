import getImageProjects from '@/actions/image-generator/projects/get-projects';
import getImagePresets from '@/actions/image-generator/presets/get-presets';
import ProjectsClient from './components/projects-client';

const ProjectsPage = async () => {
  const [projects, presets] = await Promise.all([
    getImageProjects(),
    getImagePresets(),
  ]);

  return (
    <div className="">
      <ProjectsClient projects={projects} presets={presets} />
    </div>
  );
};

export default ProjectsPage;
