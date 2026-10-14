import { useState } from 'react';
import { Card, Col, Row, Steps } from 'antd';
import { t } from 'i18next';
import WorkingDate from './working-date';
import { useParams } from 'react-router-dom';
import EditWarehouse from './warehouse-edit-new';
const { Step } = Steps;

export const steps = [
  {
    title: 'warehouse',
    content: 'Warehouse',
  },
  {
    title: 'working days',
    content: 'Working days',
  },
];

const Main = () => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    const step = current + 1;
    setCurrent(step);
  };
  const prev = () => {
    const step = current - 1;
    setCurrent(step);
  };

  return (
    <Card>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Steps current={current}>
            {steps.map((item) => (
              <Step title={t(item.title)} key={item.title} />
            ))}
          </Steps>
        </Col>
        <Col span={24}>
          {steps[current]?.content === 'Warehouse' && (
            <EditWarehouse next={next} />
          )}
          {steps[current]?.content === 'Working days' && (
            <WorkingDate next={next} prev={prev} />
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default Main;
