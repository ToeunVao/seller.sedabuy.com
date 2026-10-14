import unitService from 'services/unit';
import { UnitForm } from './unit-form';

export default function UnitAdd() {
  const onSubmit = (body) => unitService.create(body);

  return <UnitForm title='add.unit' onSubmit={onSubmit} />;
}
