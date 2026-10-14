import { useContext, useEffect, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  Button,
  Table,
  Card,
  Space,
  Tag,
  Tabs,
  Switch,
  Modal,
  Tooltip,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { export_url } from 'configs/app-global';
import { Context } from 'context/context';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch } from 'redux/slices/menu';
import productService from 'services/seller/product';
import { fetchSellerProducts } from 'redux/slices/product';
import { useTranslation } from 'react-i18next';
import useDidUpdate from 'helpers/useDidUpdate';
import SearchInput from 'components/search-input';
import brandService from 'services/rest/brand';
import categoryService from 'services/rest/category';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import { CgExport, CgImport } from 'react-icons/cg';
import RiveResult from 'components/rive-result';
import ColumnImage from 'components/column-image';
import { InfiniteSelect } from 'components/infinite-select';

const { TabPane } = Tabs;
const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];
const roles = ['all', 'published', 'pending', 'unpublished'];

const ProductList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [id, setId] = useState(null);
  const [isVisibleMsgModal, setIsVisibleMsgModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    category: null,
    brand: null,
  });
  const [hasMore, setHasMore] = useState({ category: false, brand: false });

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const handleHasMoreChange = (key, value) => {
    setHasMore((prev) => ({ ...prev, [key]: value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        id: 'product-edit',
        url: `seller/product/${row?.uuid}`,
        name: t('edit.product'),
      }),
    );
    navigate(`/seller/product/${row?.uuid}`);
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        id: `product-clone`,
        url: `seller/product-clone/${row?.uuid}`,
        name: t('clone.product'),
      }),
    );
    navigate(`/seller/product-clone/${row?.uuid}`);
  };

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (img) => <ColumnImage image={img} />,
    },
    {
      title: t('title'),
      dataIndex: 'translation',
      key: 'title',
      is_show: true,
      render: (translation) => translation?.title || t('N/A'),
    },
    {
      title: t('translations'),
      dataIndex: 'locales',
      key: 'locales',
      is_show: true,
      render: (locales) => (
        <Space>
          {locales?.map((item, index) => (
            <Tag key={item} className='text-uppercase' color={[colors[index]]}>
              {item}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('category'),
      dataIndex: 'category',
      key: 'category',
      is_show: true,
      render: (category) => category?.translation?.title || t('N/A'),
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active, row) => (
        <Switch
          checked={active}
          onChange={() => {
            setIsModalVisible(true);
            setId(row?.uuid);
            setActive(true);
          }}
        />
      ),
    },
    {
      title: t('status'),
      is_show: true,
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={
            status === 'pending'
              ? 'blue'
              : status === 'unpublished'
                ? 'red'
                : 'cyan'
          }
        >
          {t(status)}
        </Tag>
      ),
    },
    {
      title: t('translations'),
      dataIndex: 'locales',
      is_show: true,
      render: (_, row) => {
        return (
          <Space>
            {row.locales?.map((item, index) => (
              <Tag className='text-uppercase' color={[colors[index]]}>
                {item}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t('digital.file'),
      is_show: true,
      dataIndex: 'digital_file',
      key: 'digital.file',
      render: (digital_file, row) => (
        <Tag color='blue'>{t(row?.digital ? 'digital' : 'not.digital')}</Tag>
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (_, row) => (
        <Space>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <Tooltip title={t('view.reject.message')}>
            <Button
              icon={<MessageOutlined />}
              disabled={!(row?.status === 'unpublished' && row?.status_note)}
              onClick={() => {
                setIsVisibleMsgModal(true);
                setModalText(row.status_note);
              }}
            />
          </Tooltip>
          <Tooltip title={t('clone.product')}>
            <Button icon={<CopyOutlined />} onClick={() => goToClone(row)} />
          </Tooltip>
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setIsModalVisible(true);
              setId([row.id]);
              setText(true);
              setActive(false);
            }}
          />
        </Space>
      ),
    },
  ]);

  const { setIsModalVisible } = useContext(Context);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [text, setText] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { products, meta, loading } = useSelector(
    (state) => state.product,
    shallowEqual,
  );

  const params = {
    search: filters.search || undefined,
    category_id: filters.category?.value,
    brand_id: filters.brand?.value,
    status: filters.status !== 'all' ? filters.status : undefined,
    page: filters.page,
    perPage: 10,
  };

  const productDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    productService
      .delete(params)
      .then(() => {
        setIsModalVisible(false);
        toast.success(t('successfully.deleted'));
        dispatch(fetchSellerProducts(params));
      })
      .finally(() => setLoadingBtn(false));
  };

  const handleActive = () => {
    setLoadingBtn(true);
    productService
      .setActive(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(fetchSellerProducts(params));
        toast.success(t('successfully.updated'));
        setActive(true);
      })
      .finally(() => setLoadingBtn(false));
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const goToAddProduct = () => {
    dispatch(
      addMenu({
        id: 'product-add',
        url: 'seller/product/add',
        name: t('add.product'),
      }),
    );
    navigate('/seller/product/add');
  };

  const goToImport = () => {
    dispatch(
      addMenu({
        id: 'seller-product-import',
        url: `seller/product/import`,
        name: t('product.import'),
      }),
    );
    navigate(`/seller/product/import`);
  };

  const fetchBrands = ({ search, page }) => {
    const params = {
      search: search || undefined,
      page,
    };
    return brandService.getAll(params).then((res) => {
      handleHasMoreChange('brand', Boolean(res?.links?.next));
      return res?.data?.map((item) => ({
        label: item?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const fetchCategories = ({ search, page }) => {
    const params = {
      search: search || undefined,
      type: 'main',
      page,
    };
    return categoryService.search(params).then((res) => {
      handleHasMoreChange('category', Boolean(res?.links?.next));
      return res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const excelExport = () => {
    setDownloading(true);
    productService
      .export(params)
      .then((res) => {
        if (res?.data?.file_name) {
          window.location.href = `${export_url}${res?.data?.file_name}`;
        }
      })
      .finally(() => setDownloading(false));
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.the.product'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchSellerProducts(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  return (
    <>
      <Card>
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            defaultValue={filters.search}
            resetSearch={!filters.search}
            style={{ width: 200 }}
            handleChange={(e) => handleFiltersChange({ search: e, page: 1 })}
          />
          <InfiniteSelect
            placeholder={t('select.category')}
            hasMore={hasMore.category}
            style={{ minWidth: 180 }}
            value={filters.category}
            fetchOptions={fetchCategories}
            onChange={(category) => handleFiltersChange({ category, page: 1 })}
          />
          <InfiniteSelect
            placeholder={t('select.brand')}
            hasMore={hasMore.brand}
            style={{ minWidth: 180 }}
            value={filters.brand}
            fetchOptions={fetchBrands}
            onChange={(brand) => handleFiltersChange({ brand, page: 1 })}
          />
          <Button onClick={goToImport}>
            <CgImport className='mr-2' />
            {t('import')}
          </Button>
          <Button loading={downloading} onClick={excelExport}>
            <CgExport className='mr-2' />
            {t('export')}
          </Button>
          <FilterColumns columns={columns} setColumns={setColumns} />
          <Button type='primary' onClick={goToAddProduct}>
            {t('add.product')}
          </Button>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
        </Space>

        <Tabs
          className='mt-3'
          activeKey={filters.status}
          type='card'
          onChange={(status) => {
            handleFiltersChange({ status, page: 1 });
          }}
        >
          {roles.map((item) => (
            <TabPane tab={t(item)} key={item} />
          ))}
        </Tabs>

        <Table
          locale={{
            emptyText: <RiveResult />,
          }}
          scroll={{ x: true }}
          rowSelection={rowSelection}
          loading={loading}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={products}
          pagination={{
            showSizeChanger: false,
            pageSize: meta?.per_page || 10,
            total: meta?.total || 0,
            current: meta?.current_page || 1,
          }}
          rowKey={(record) => record?.id}
          onChange={onChangePagination}
        />
      </Card>
      <CustomModal
        click={active ? handleActive : productDelete}
        text={
          active
            ? t('set.active.product')
            : text
              ? t('delete')
              : t('all.delete')
        }
        loading={loadingBtn}
        setText={setId}
        setActive={setActive}
      />
      <Modal
        title={t('reject.message')}
        closable={false}
        visible={isVisibleMsgModal}
        footer={null}
        centered
      >
        <p>{modalText}</p>
        <div className='d-flex justify-content-end'>
          <Button
            type='primary'
            className='mr-2'
            onClick={() => setIsVisibleMsgModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ProductList;
