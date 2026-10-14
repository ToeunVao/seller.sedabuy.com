import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Modal, Space, Table } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { fetchSellerShopLocations } from 'redux/slices/shop-locations';
import { DeleteOutlined } from '@ant-design/icons';
import LocationSelect from './location-select';
import shopLocationsService from 'services/seller/shop-locations';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import ColumnImage from 'components/column-image';
import useDidUpdate from 'helpers/useDidUpdate';
import { disableRefetch } from 'redux/slices/menu';

const ShopLocations = ({ next, prev }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { locations, loading, meta } = useSelector(
    (state) => state.shopLocations,
  );
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const { setIsModalVisible } = useContext(Context);

  const [ids, setIds] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [isLocationSelectModalOpen, setIsLocationSelectModalOpen] =
    useState(false);
  const [filters, setFilters] = useState({ page: 1 });

  const shopId = myShop?.id;

  const params = {
    shop_id: shopId,
    page: filters.page,
    perPage: 10,
  };

  const columns = [
    {
      title: t('location'),
      dataIndex: 'location',
      key: 'location',
      render: (_, row) => (
        <span>
          {[row?.country?.translation?.title, row?.city?.translation?.title]
            .filter(Boolean)
            .join(', ')}
        </span>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'country',
      key: 'image',
      render: (country) => (
        <ColumnImage image={country?.img} alt={country?.translation?.title} />
      ),
    },

    {
      title: t('options'),
      dataIndex: 'options',
      key: 'options',
      render: (_, row) => (
        <Space>
          <Button
            onClick={() => {
              setIds([row.id]);
              setIsModalVisible(true);
            }}
            icon={<DeleteOutlined />}
          />
        </Space>
      ),
    },
  ];

  const handleFilterChange = (values = {}) => {
    setFilters((prev) => ({ ...prev, ...values }));
  };

  const handleTableChange = (pagination) => {
    handleFilterChange({ page: pagination.current });
  };

  const handleDelete = () => {
    setLoadingBtn(true);
    const paramsData = {
      ...Object.assign(
        {},
        ...ids.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    shopLocationsService
      .delete(paramsData)
      .then(() => {
        handleFilterChange({ page: 1 });
        toast.success(t('successfully.deleted'));
      })
      .finally(() => {
        setIds(null);
        setLoadingBtn(false);
        setIsModalVisible(false);
      });
  };

  const goToAdd = (values) => {
    const country = values.country.value.split(',')[0];
    const region = values.country.value.split(',')[1];
    const body = {
      country_id: country,
      region_id: region,
      shop_id: shopId,
    };
    if (values.city.value !== 'all') {
      body.city_id = values.city?.value;
    }
    setLoadingBtn(true);
    shopLocationsService
      .create(body)
      .then(() => {
        toast.success(t('successfully.saved'));
        handleFilterChange({ page: 1 });
        setIsLocationSelectModalOpen(false);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  const fetch = () => {
    dispatch(fetchSellerShopLocations(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (shopId) {
      fetch();
    }
  }, [shopId]);

  useDidUpdate(() => {
    if (shopId) {
      fetch();
    }
  }, [filters, shopId]);

  useDidUpdate(() => {
    if (activeMenu.refetch && shopId) {
      fetch();
    }
  }, [activeMenu.refetch, shopId]);

  return (
    <>
      <Space className='justify-content-end w-100'>
        <Button
          onClick={() => setIsLocationSelectModalOpen(true)}
          type='primary'
        >
          {t('add.location')}
        </Button>
      </Space>
      <Table
        loading={loading}
        dataSource={locations}
        columns={columns}
        pagination={{
          showSizeChanger: false,
          pageSize: meta?.per_page || 10,
          total: meta?.total || 0,
          current: meta?.current_page || 1,
        }}
        onChange={handleTableChange}
      />
      <Divider />
      <Space className='w-100 justify-content-end'>
        <Button htmlType='button' onClick={() => prev()}>
          {t('prev')}
        </Button>
        <Button type='primary' htmlType='button' onClick={() => next()}>
          {t('next')}
        </Button>
      </Space>
      <Modal
        title={t('add.shop.location')}
        footer={null}
        visible={isLocationSelectModalOpen}
        destroyOnClose
        onCancel={() => setIsLocationSelectModalOpen(false)}
      >
        <LocationSelect
          onClose={() => setIsLocationSelectModalOpen(false)}
          onSubmit={goToAdd}
          isButtonLoading={loadingBtn}
        />
      </Modal>
      <CustomModal
        click={handleDelete}
        text={t('delete.location')}
        setText={setIds}
        loading={loadingBtn}
      />
    </>
  );
};

export default ShopLocations;
