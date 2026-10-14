import { useContext, useState } from 'react';
import {
  CloudUploadOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Switch, Table, Tooltip } from 'antd';
import { toast } from 'react-toastify';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import { fetchBlogs } from 'redux/slices/blog';
import useDidUpdate from 'helpers/useDidUpdate';
import blogService from 'services/blog';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import moment from 'moment';
import ColumnImage from 'components/column-image';

export default function Blogs() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { blogs, meta, loading } = useSelector(
    (state) => state.blog,
    shallowEqual,
  );
  const { setIsModalVisible } = useContext(Context);

  const [id, setId] = useState(null);
  const [isDelete, setIsDelete] = useState(false);
  const [isPublish, setIsPublish] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
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
      key: 'translation',
      is_show: true,
      render: (translation) => translation?.title,
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      is_show: true,
      render: (img) => <ColumnImage image={img} />,
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (createdAt) => moment(createdAt).format('YYYY-MM-DD'),
    },
    {
      title: t('published.at'),
      dataIndex: 'published_at',
      key: 'published_at',
      is_show: true,
      render: (publishedAt) => moment(publishedAt).format('YYYY-MM-DD'),
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
            setId(row.uuid);
            setIsDelete(false);
            setIsPublish(false);
            setIsModalVisible(true);
          }}
        />
      ),
    },
    {
      title: t('options'),
      key: 'options',
      is_show: true,
      render: (row) => (
        <Space>
          <Tooltip title={t('publish')}>
            <Button
              disabled={Boolean(row?.published_at || !row.active)}
              icon={<CloudUploadOutlined />}
              onClick={() => {
                setId(row.uuid);
                setIsDelete(false);
                setIsPublish(true);
                setIsModalVisible(true);
              }}
            />
          </Tooltip>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => goToEdit(row)}
          />
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([row.id]);
              setIsDelete(true);
              setIsPublish(false);
              setIsModalVisible(true);
            }}
          />
        </Space>
      ),
    },
  ]);

  const params = {
    perPage: 10,
    page: filters.page,
  };

  const handleFiltersChange = (value = {}) => {
    setFilters((prev) => ({ ...prev, ...value }));
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `blog/${row.uuid}`,
        id: 'blog_edit',
        name: t('edit.blog'),
      }),
    );
    navigate(`/blog/${row.uuid}`);
  };

  const goToClone = (row) => {
    dispatch(
      addMenu({
        url: `blog/clone/${row.uuid}`,
        id: 'blog_clone',
        name: t('clone.blog'),
      }),
    );
    navigate(`/blog/clone/${row.uuid}`);
  };

  const blogDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };

    blogService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
      });
  };

  const blogSetActive = () => {
    setLoadingBtn(true);
    blogService
      .setActive(id)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setIsModalVisible(false);
        setLoadingBtn(false);
      });
  };

  const blogPublish = () => {
    setLoadingBtn(true);
    blogService
      .publish(id)
      .then(() => {
        toast.success(t('successfully.updated'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setLoadingBtn(false);
        setIsModalVisible(false);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const goToAddBlog = () => {
    dispatch(
      addMenu({
        id: 'blogs',
        url: 'blog/add',
        name: t('add.blog'),
      }),
    );
    navigate('/blog/add');
  };

  const rowSelection = {
    selectedRowKeys: id,
    onChange: (key) => {
      setId(key);
    },
  };

  const allDelete = () => {
    if (id === null || id.length === 0) {
      toast.warning(t('select.blog'));
    } else {
      setIsModalVisible(true);
    }
  };

  const fetch = () => {
    dispatch(fetchBlogs(params));
    dispatch(disableRefetch(activeMenu));
  };

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    fetch();
  }, [filters]);

  return (
    <Card
      title={t('blogs')}
      extra={
        <Space wrap>
          <Button
            type='primary'
            icon={<PlusCircleOutlined />}
            onClick={goToAddBlog}
          >
            {t('add.blog')}
          </Button>
          <DeleteButton size='' onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <FilterColumns setColumns={setColumns} columns={columns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        rowSelection={rowSelection}
        columns={columns.filter((column) => column.is_show)}
        dataSource={blogs}
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
      <CustomModal
        click={isPublish ? blogPublish : isDelete ? blogDelete : blogSetActive}
        text={
          isPublish
            ? t('publish.blog')
            : isDelete
              ? t('delete.blog')
              : t('set.active.blog')
        }
        loading={loadingBtn}
      />
    </Card>
  );
}
