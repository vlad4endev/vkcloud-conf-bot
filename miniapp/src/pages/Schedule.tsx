import ErrorBoundary from '../components/ErrorBoundary';
import ProgramSection from '../components/ProgramSection';

export default function Schedule() {
  return (
    <div className="page program-page">
      <ErrorBoundary title="Программа">
        <ProgramSection />
      </ErrorBoundary>
    </div>
  );
}
