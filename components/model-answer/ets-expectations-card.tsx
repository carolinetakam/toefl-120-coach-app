type ETSExpectationsCardProps = {
  section: 'speaking' | 'writing';
  expectations?: string[];
};

const defaultExpectations: Record<ETSExpectationsCardProps['section'], string[]> = {
  speaking: ['Clear main idea', 'Organized support', 'Task source/detail included', 'Complete final sentence'],
  writing: ['Clear position or source relationship', 'Organized paragraphs', 'Specific support', 'Controlled conclusion'],
};

export function ETSExpectationsCard({ section, expectations }: ETSExpectationsCardProps) {
  const items = expectations?.length ? expectations : defaultExpectations[section];

  return (
    <div className="modelExpectationsCard stack">
      <div className="row">
        <h3>What ETS Wants</h3>
        <span className="chip">{section === 'speaking' ? 'Speaking' : 'Writing'}</span>
      </div>
      <div className="chips">
        {items.map((item) => (
          <span className="chip" key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
