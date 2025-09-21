import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, onClick }) => {
  return (
    <div className="feature-card" onClick={onClick}>
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const FeatureCards = () => {
  return (
    <section className="feature-cards">
      <h2>核心功能</h2>
      <div className="cards-container">
        <FeatureCard
          title="合同风险审查"
          description="智能分析合同条款，识别潜在风险点，提供专业修改建议"
          icon="📄"
          onClick={() => console.log('合同风险审查')}
        />
        <FeatureCard
          title="全自动催款函"
          description="基于案件信息自动生成专业催款函，支持邮件发送与追踪"
          icon="✉️"
          onClick={() => console.log('全自动催款函')}
        />
        <FeatureCard
          title="专业法律报告"
          description="根据案情自动生成结构化法律分析报告，支持PDF导出"
          icon="📊"
          onClick={() => console.log('专业法律报告')}
        />
      </div>
    </section>
  );
};

export default FeatureCards;
