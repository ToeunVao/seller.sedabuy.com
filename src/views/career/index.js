import { useContext, useEffect, useState } from 'react';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Divider, Space, Table, Tag } from 'antd';
import { Context } from 'context/context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import careerService from 'services/career';
import { fetchCareer } from 'redux/slices/career';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import RiveResult from 'components/rive-result';

const colors = ['blue', 'red', 'gold', 'volcano', 'cyan', 'lime'];

const Career = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { career, meta, loading } = useSelector(
    (state) => state.career,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({ page: 1 });
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
      render: (translation) => translation?.title,
    },
    {
      title: t('translations'),
      dataIndex: 'locales',
      key: 'locales',
      is_show: true,
      render: (locales) => {
        return (
          <Space>
            {locales?.map((item, index) => (
              <Tag className='text-uppercase' color={[colors[index]]}>
                {item}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t('category'),
      dataIndex: 'category',
      key: 'category',
      is_show: true,
      render: (category) => category?.translation?.title || t('N/A'),
    },
    {
      title: t('status'),
      dataIndex: 'active',
      key: 'active',
      is_show: true,
      render: (active) => (
        <Tag color={active ? 'cyan' : 'yellow'}>
          {t(active ? 'active' : 'inactive')}
        </Tag>
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
            onClick={() => goToEdit(row?.id)}
          />
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row?.id)} />
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
    page: filters.page,
    perPage: 10,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (id) => {
    dispatch(
      addMenu({
        id: 'career_edit',
        url: `career/${id}`,
        name: t('edit.career'),
      }),
    );
    navigate(`/career/${id}`);
  };

  const goToAddCategory = () => {
    dispatch(
      addMenu({
        id: 'career_add',
        url: 'career/add',
        name: t('add.career'),
      }),
    );
    navigate('/career/add');
  };

  const goToClone = (id) => {
    dispatch(
      addMenu({
        id: `career-clone`,
        url: `career-clone/${id}`,
        name: t('career.clone'),
      }),
    );
    navigate(`/career-clone/${id}`);
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
    careerService
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
      toast.warning(t('select.career'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchCareer(params));
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
      <Card>
        <Space wrap size={12}>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFiltersChange({ search, page: 1 })}
            defaultValue={filters.search}
            resetSearch={!filters.search}
            style={{ width: 200 }}
          />
          <FilterColumns columns={columns} setColumns={setColumns} />
          <DeleteButton onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={goToAddCategory}
          >
            {t('add.career')}
          </Button>
        </Space>
        <Divider />
        <Table
          loading={loading}
          locale={{
            emptyText: <RiveResult />,
          }}
          scroll={{ x: true }}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={career}
          pagination={{
            showSizeChanger: false,
            pageSize: meta.per_page || 10,
            current: meta?.current_page || 1,
            total: meta?.total || 0,
          }}
          rowKey={(record) => record.id}
          onChange={onChangePagination}
        />
      </Card>

      <CustomModal
        click={categoryDelete}
        text={text ? t('delete') : t('delete.selected')}
        setText={setId}
        loading={loadingBtn}
      />
    </>
  );
};

export default Career;
