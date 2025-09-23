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
      <div className="card-content">
        <div className="card-icon">{icon}</div>
        <h3 className="feature-card-title">{title}</h3>
      </div>
      <p className="feature-card-description">{description}</p>
    </div>
  );
};

const FeatureCards = () => {
  const features = [
    {
      title: '合同风险审查',
      description: '请帮站在甲方的立场下，审查下这份合同，提炼出核心风险点，并返回修订版word文件。',
      icon: '📄'
    },
    {
      title: '盖章版律师函',
      description: '对方公司的微信公众号名称，侵犯我司"律友"的42类商标，请起草一份律师函。',
      icon: '✉️'
    },
    {
      title: '专业法律报告',
      description: '请你深入研究，出一份案情分析报告，案情如下:张三开公司的车给客户送货，发生交通事故...',
      icon: '📊'
    },
    {
      title: '法律咨询',
      description: '针对您的法律问题，提供专业解答和建议，帮助您了解相关法律规定和应对策略。',
      icon: '💼'
    }
  ];

  return (
    <div className="feature-cards">
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          onClick={() => console.log('点击功能:', feature.title)}
        />
      ))}
    </div>
  );
};

export default FeatureCards;
