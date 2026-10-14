import { useParams } from 'react-router-dom';
import shopTagService from 'services/shopTag';
import { ShopTagForm } from './form';

const TagClone = () => {
  const { id } = useParams();

  const onSubmit = (body) => shopTagService.create(body);

  return <ShopTagForm title='clone.shop.tag' id={id} onSubmit={onSubmit} />;
};

export default TagClone;
