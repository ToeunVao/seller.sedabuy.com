import unitService from 'services/unit';
import { useParams } from 'react-router-dom';
import { UnitForm } from './unit-form';

export default function UnitEdit() {
  const { id } = useParams();
  const onSubmit = (body) => unitService.update(id, body);

  return <UnitForm title='edit.unit' id={id} onSubmit={onSubmit} />;
}
