import { useState, useEffect } from 'react';
import { Card, Col, Descriptions, Modal, Row, Space, Switch, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import CategoryList from './category-list';
import SubcategoryAdd from './subcategory-add';
import { CustomCard } from 'components/custom-card';
import ColumnImage from 'components/column-image';
import useDidUpdate from 'helpers/useDidUpdate';

const CategoryShow = () => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const dispatch = useDispatch();
  const [data, setData] = useState({});
  const [id, setId] = useState(null);
  const [isRefetch, setIsRefetch] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [loading, setLoading] = useState(false);

  const fetchCategory = () => {
    setLoading(true);
    categoryService
      .getById(uuid)
      .then((res) => {
        setData(res?.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAddAction = (id) => {
    setId(id);
  };

  const handleCancel = () => {
    setId(null);
  };

  const fetch = () => {
    fetchCategory();
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (uuid) {
      fetch();
    }
  }, [uuid]);

  useDidUpdate(() => {
    if (activeMenu.refetch && uuid) {
      fetch();
    }
  }, [activeMenu.refetch, uuid]);

  return (
    <>
      <Card>
        <Row gutter={[12, 24]} className='mb-4'>
          <Col span={24}>
            <CustomCard title={t('basic.info')} loading={loading}>
              <Descriptions bordered>
                <Descriptions.Item label={t('title')} span={1.5}>
                  {data?.translation?.title || t('N/A')}
                </Descriptions.Item>
                <Descriptions.Item label={t('description')} span={1.5}>
                  {data?.translation?.title || t('N/A')}
                </Descriptions.Item>
              </Descriptions>
            </CustomCard>
          </Col>
          <Col span={24}>
            <CustomCard title={t('additional.information')} loading={loading}>
              <Descriptions bordered>
                {Boolean(data?.parent) && (
                  <Descriptions.Item label={t('parent')} span={1.5}>
                    {data?.parent?.translation?.title || t('N/A')}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t('keywords')} span={1.5}>
                  <Space wrap>
                    {data?.keywords?.split(',')?.map((keyword, index) => (
                      <Tag key={index}>{keyword}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('order.of.category')} span={1.5}>
                  {data?.input}
                </Descriptions.Item>
                <Descriptions.Item label={t('image')} span={1.5}>
                  <ColumnImage image={data?.img} />
                </Descriptions.Item>
                <Descriptions.Item label={t('active')} span={1.5}>
                  <Switch checked={Boolean(data?.active)} />
                </Descriptions.Item>
              </Descriptions>
            </CustomCard>
          </Col>
        </Row>

        {Boolean(data?.id) && (
          <CustomCard>
            <CategoryList
              type={data?.type === 'main' ? 'sub_main' : 'child'}
              parent_type={data?.type}
              parentId={data?.id}
              handleAddAction={handleAddAction}
              isRefetch={isRefetch}
              container={false}
            />
          </CustomCard>
        )}
      </Card>
      <Modal
        title={t('add.subcategory')}
        visible={Boolean(id)}
        onCancel={handleCancel}
        centered
        footer={null}
        destroyOnClose
      >
        <SubcategoryAdd
          setId={setId}
          id={id}
          setIsRefetch={setIsRefetch}
          parent={{
            parent_id: {
              label: data?.translation?.title || t('N/A'),
              value: data?.id,
              key: data?.id,
            },
            id: data?.id,
            type: data?.type,
          }}
        />
      </Modal>
    </>
  );
};
export default CategoryShow;
