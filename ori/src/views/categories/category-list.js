import { useContext, useEffect, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Button, Card, Divider, Space, Switch, Table, Tabs, Tag } from 'antd';
import { export_url } from 'configs/app-global';
import { Context } from 'context/context';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import categoryService from 'services/category';
import { fetchCategories } from 'redux/slices/category';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import { CgExport, CgImport } from 'react-icons/cg';
import CategoryStatusModal from './categoryStatusModal';
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

  const { categories, meta, loading } = useSelector(
    (state) => state.category,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { setIsModalVisible } = useContext(Context);

  const [categoryDetails, setCategoryDetails] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    status: 'all',
    search: '',
  });
  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [text, setText] = useState(null);

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
            <Tag key={item} className='text-uppercase' color={[colors[index]]}>
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
            setText(t('set.active.text'));
          }}
          checked={active}
        />
      ),
    },
    {
      title: t('featured'),
      dataIndex: 'featured',
      is_show: true,
      render: (featured, row) => (
        <Switch
          onChange={() => {
            setIsModalVisible(true);
            setId(row?.uuid);
            setText(t('set.featured.text'));
          }}
          checked={Boolean(featured)}
        />
      ),
    },
    {
      title: t('status'),
      is_show: true,
      dataIndex: 'status',
      key: 'status',
      render: (status, row) => (
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => setCategoryDetails(row)}
        >
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
          <EditOutlined />
        </Space>
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => goToShow(row)} />
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row.uuid)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([row.id]);
              setText(t('delete'));
              setIsModalVisible(true);
            }}
          />
        </Space>
      ),
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
        url: `category/${row.uuid}`,
        id: parentId ? 'category_sub_edit' : 'category_edit',
        name: parentId ? t('edit.sub.category') : t('edit.category'),
      }),
    );
    navigate(`/category/${row.uuid}`, { state: { parentId, parentUuid } });
  };

  const goToShow = (row) => {
    dispatch(
      addMenu({
        url: `category/show/${row.uuid}`,
        id: 'category_show',
        name: t('category.show'),
      }),
    );
    navigate(`/category/show/${row.uuid}`, { state: { parentId, parentUuid } });
  };

  const goToAdd = () => {
    if (parentId) {
      handleAddAction(parentId);
    } else {
      dispatch(
        addMenu({
          id: parentId ? 'sub-category-add' : 'category-add',
          url: 'category/add',
          name: parentId ? t('add.sub.category') : t('add.category'),
        }),
      );
      navigate('/category/add', { state: { parentId, parentUuid } });
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

  const goToClone = (uuid) => {
    dispatch(
      addMenu({
        id: parentId ? 'sub-category-clone' : `category-clone`,
        url: `category-clone/${uuid}`,
        name: parentId ? t('sub.category.clone') : t('category.clone'),
      }),
    );
    navigate(`/category-clone/${uuid}`, { state: { parentId, parentUuid } });
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
    categoryService
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

  const handleActive = () => {
    setLoadingBtn(true);
    categoryService
      .setActive(id)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setId(null);
        setText(null);
      });
  };

  const handleFeaturedChange = () => {
    setLoadingBtn(true);
    categoryService
      .setFeatured(id)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
        setId(null);
        setText(null);
      });
  };

  const handleChangeCustomModal = () => {
    switch (text) {
      case t('delete'):
      case t('delete.selected'):
        categoryDelete();
        break;
      case t('set.active.text'):
        handleActive();
        break;
      case t('set.featured.text'):
        handleFeaturedChange();
        break;
      default:
        break;
    }
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const excelExport = () => {
    setDownloading(true);
    categoryService
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
      setText(t('delete.selected'));
    }
  };

  const fetch = () => {
    dispatch(fetchCategories(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetch();
    }
  }, []);

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
          loading={loading}
          onChange={onChangePagination}
        />
      </RenderContent>

      <CustomModal
        click={handleChangeCustomModal}
        text={text}
        setText={setId}
        loading={loadingBtn}
      />

      {Boolean(categoryDetails) && (
        <CategoryStatusModal
          categoryDetails={categoryDetails}
          handleCancel={() => setCategoryDetails(null)}
        />
      )}
    </>
  );
};

export default CategoryList;
