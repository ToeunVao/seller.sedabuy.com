import { useParams } from 'react-router-dom';
import brandService from 'services/brand';
import { BrandForm } from './brand-form';

const BrandsEdit = () => {
  const { id } = useParams();

  const onSubmit = (body) => brandService.update(id, body);

  return <BrandForm title='edit.brand' id={id} onSubmit={onSubmit} />;
};

export default BrandsEdit;
