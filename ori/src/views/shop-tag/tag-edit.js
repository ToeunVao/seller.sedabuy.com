import { useParams } from 'react-router-dom';
import shopTagService from 'services/shopTag';
import { ShopTagForm } from './form';

const TagEdit = () => {
  const { id } = useParams();

  const onSubmit = (body) => shopTagService.update(id, body);

  return <ShopTagForm title='edit.shop.tag' id={id} onSubmit={onSubmit} />;
};

export default TagEdit;
