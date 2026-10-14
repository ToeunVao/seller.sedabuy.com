import { useContext, useEffect, useState } from 'react';
import { Button, Card, Divider, Space, Switch, Table, Tabs, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { fetchSellerCategory } from 'redux/slices/category';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import sellerCategory from 'services/seller/category';
import { useNavigate, useParams } from 'react-router-dom';
import FilterColumns from 'components/filter-column';
import useDidUpdate from 'helpers/useDidUpdate';
import SearchInput from 'components/search-input';
import DeleteButton from 'components/delete-button';
import { CgExport, CgImport } from 'react-icons/cg';
import { export_url } from 'configs/app-global';
import ColumnImage from 'components/column-image';

const { TabPane } = Tabs;

const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];
const roles = ['all', 'pending', 'published', 'unpublished'];

const CategoryList = ({
  parentId,
  type = 'main',
  parent_type,
  handleAddAction = () => {},
  activeTab = 'list',
  container = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { uuid: parentUuid } = useParams();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { categories, meta, loading } = useSelector(
    (state) => state.category,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [active, setActive] = useState(null);
  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    status: 'all',
    search: '',
  });

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
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
      is_show: true,
      render: (locales) => (
        <Space>
          {locales?.map((item, index) => (
            <Tag className='text-uppercase' color={[colors[index]]}>
              {item}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (img) => <ColumnImage image={img} />,
    },
    {
      title: t('active'),
      dataIndex: 'active',
      is_show: true,
      render: (active, row) => (
        <Switch
          onChange={() => {
            setIsModalVisible(true);
            setId(row.uuid);
            setActive(true);
          }}
          checked={active}
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
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => {
        return (
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => goToShow(row)} />
            <Button
              type='primary'
              icon={<EditOutlined />}
              onClick={() => goToEdit(row)}
            />
            <DeleteButton
              icon={<DeleteOutlined />}
              onClick={() => {
                setId([row.id]);
                setIsModalVisible(true);
                setText(true);
              }}
            />
          </Space>
        );
      },
    },
  ]);

  const params = {
    search: filters.search || undefined,
    perPage: 10,
    page: filters.page,
    status: filters.status !== 'all' ? filters.status : undefined,
    type,
    parent_id: parentId,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `seller/category/${row.uuid}`,
        id: parentId ? 'category_sub_edit' : 'category_edit',
        name: parentId ? t('edit.sub.category') : t('edit.category'),
      }),
    );
    navigate(`/seller/category/${row.uuid}`, {
      state: { parentId, parentUuid },
    });
  };

  const goToShow = (row) => {
    dispatch(
      addMenu({
        url: `seller/category/show/${row.uuid}`,
        id: 'category_show',
        name: t('category.show'),
      }),
    );
    navigate(`/seller/category/show/${row.uuid}`, {
      state: { parentId, parentUuid },
    });
  };

  const goToAdd = () => {
    if (parentId) {
      handleAddAction(parentId);
    } else {
      dispatch(
        addMenu({
          id: parentId ? 'sub-category-add' : 'category-add',
          url: 'seller/category/add',
          name: parentId ? t('add.sub.category') : t('add.category'),
        }),
      );
      navigate('/seller/category/add', { state: { parentId, parentUuid } });
    }
  };

  const goToImport = () => {
    dispatch(
      addMenu({
        url: `catalog/categories/import`,
        id: parentId ? 'sub_category_import' : 'category_import',
        name: parentId ? t('import.sub.category') : t('import.category'),
      }),
    );
    navigate(`/catalog/categories/import`, { state: { parentId, parentUuid } });
  };

  const categoryDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    sellerCategory
      .delete(params)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.deleted'));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setText(null);
        setId(null);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const excelExport = () => {
    setDownloading(true);
    sellerCategory
      .export(params)
      .then((res) => {
        if (res?.data?.file_name) {
          window.location.href = `${export_url}${res.data.file_name}`;
        }
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.category'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const handleActive = () => {
    setLoadingBtn(true);
    sellerCategory
      .setActive(id)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setActive(false);
        setId(null);
      });
  };

  const fetch = () => {
    dispatch(fetchSellerCategory(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetch();
    }
  }, [activeTab]);

  useDidUpdate(() => {
    if (activeMenu.refetch && activeTab === 'list') {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch, activeTab]);

  useDidUpdate(() => {
    fetch();
  }, [parentId, type, filters]);

  const RenderContent = ({ children }) =>
    container ? <Card>{children}</Card> : <>{children}</>;

  return (
    <>
      <RenderContent>
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFiltersChange({ search, page: 1 })}
            defaultValue={filters.search}
            resetSearch={!filters.search}
            style={{ width: 200 }}
          />
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns columns={columns} setColumns={setColumns} />
          <Button onClick={goToImport}>
            <CgImport className='mr-2' />
            {t('import')}
          </Button>
          <Button loading={downloading} onClick={excelExport}>
            <CgExport className='mr-2' />
            {t('export')}
          </Button>
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          {parent_type !== 'child' && (
            <Button type='primary' onClick={goToAdd}>
              {t('add.category')}
            </Button>
          )}
        </Space>
        <Divider />
        <Tabs
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
          scroll={{ x: true }}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={categories}
          pagination={{
            showSizeChanger: false,
            current: meta?.current_page || 1,
            total: meta?.total || 0,
            pageSize: meta?.per_page || 10,
          }}
          rowKey={(record) => record.id}
          onChange={onChangePagination}
          loading={loading}
        />
      </RenderContent>

      <CustomModal
        click={active ? handleActive : categoryDelete}
        text={
          active
            ? t('set.active.category')
            : text
              ? t('delete')
              : t('delete.selected')
        }
        setText={setId}
        loading={loadingBtn}
      />
    </>
  );
};

export default CategoryList;
