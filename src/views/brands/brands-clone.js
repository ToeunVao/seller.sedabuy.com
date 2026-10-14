import { useParams } from 'react-router-dom';
import brandService from 'services/brand';
import { BrandForm } from './brand-form';

const BrandsEdit = () => {
  const { id } = useParams();

  const onSubmit = (body) => brandService.create(body);

  return <BrandForm title='clone.brand' id={id} onSubmit={onSubmit} />;
};

export default BrandsEdit;
