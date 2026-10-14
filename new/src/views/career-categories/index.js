import { useContext, useEffect, useState } from 'react';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Space, Table, Tabs, Tag, Switch, Divider } from 'antd';
import { Context } from 'context/context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import categoryService from 'services/category';
import { fetchCareerCategories } from 'redux/slices/career-category';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import ColumnImage from 'components/column-image';
import CategoryStatusModal from './career-category-status-modal';

const { TabPane } = Tabs;

const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];
const roles = ['all', 'pending', 'published', 'unpublished'];

const CareerCategories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { careerCategory, meta, loading } = useSelector(
    (state) => state.careerCategory,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [active, setActive] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    status: 'all',
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
      key: 'locales',
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
      render: (image) => <ColumnImage image={image} />,
    },
    {
      title: t('active'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active, row) => (
        <Switch
          onChange={() => {
            setIsModalVisible(true);
            setId(row?.uuid);
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
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row?.uuid)}
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => goToClone(row?.uuid)}
          />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([row?.id]);
              setIsModalVisible(true);
              setText(true);
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
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (uuid) => {
    dispatch(
      addMenu({
        url: `career-categories/${uuid}`,
        id: 'career-categories-edit',
        name: t('edit.career.categories'),
      }),
    );
    navigate(`/career-categories/${uuid}`);
  };

  const goToAddCategory = () => {
    dispatch(
      addMenu({
        id: 'career-categories-add',
        url: 'career-categories/add',
        name: t('add.career.categories'),
      }),
    );
    navigate('/career-categories/add');
  };

  const goToClone = (uuid) => {
    dispatch(
      addMenu({
        id: `career-categories-clone`,
        url: `career-categories-clone/${uuid}`,
        name: t('career.categories.clone'),
      }),
    );
    navigate(`/career-categories-clone/${uuid}`);
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
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
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

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.career.category'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const handleActive = () => {
    setLoadingBtn(true);
    categoryService
      .setActive(id)
      .then(() => {
        setIsModalVisible(false);
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
        setActive(false);
      })
      .finally(() => setLoadingBtn(false));
  };

  const fetch = () => {
    dispatch(fetchCareerCategories(params));
    dispatch(disableRefetch(activeMenu));
  };

  useEffect(() => {
    fetch();
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
      <Card className='p-0'>
        <Space wrap size={[14, 20]}>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFiltersChange({ search, page: 1 })}
            defaultValue={filters.search}
            resetSearch={!filters.search}
            style={{ minWidth: 200 }}
          />
          <FilterColumns columns={columns} setColumns={setColumns} />
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <Button type='primary' onClick={goToAddCategory}>
            {t('add.career.category')}
          </Button>
        </Space>
        <Divider />
        <Tabs
          activeKey={filters.status}
          type='card'
          onChange={(status) => handleFiltersChange({ status, page: 1 })}
        >
          {roles.map((item) => (
            <TabPane tab={t(item)} key={item} />
          ))}
        </Tabs>
        <Table
          scroll={{ x: true }}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={careerCategory?.map((item) => ({
            ...(item || {}),
            children: null,
          }))}
          pagination={{
            showSizeChanger: false,
            pageSize: meta?.per_page || 10,
            total: meta?.total || 0,
            current: meta?.current_page || 1,
          }}
          rowKey={(record) => record.id}
          onChange={onChangePagination}
          loading={loading}
        />
      </Card>
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
      {Boolean(categoryDetails) && (
        <CategoryStatusModal
          categoryDetails={categoryDetails}
          handleCancel={() => setCategoryDetails(null)}
        />
      )}
    </>
  );
};

export default CareerCategories;
