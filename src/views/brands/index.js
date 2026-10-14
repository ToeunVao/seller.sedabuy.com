import { useContext, useEffect, useState } from 'react';
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Space, Table, Tag } from 'antd';
import { toast } from 'react-toastify';
import { export_url } from 'configs/app-global';
import CustomModal from 'components/modal';
import { Context } from 'context/context';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addMenu, disableRefetch, setRefetch } from 'redux/slices/menu';
import brandService from 'services/brand';
import { fetchBrands } from 'redux/slices/brand';
import { useTranslation } from 'react-i18next';
import DeleteButton from 'components/delete-button';
import FilterColumns from 'components/filter-column';
import SearchInput from 'components/search-input';
import useDidUpdate from 'helpers/useDidUpdate';
import { CgExport, CgImport } from 'react-icons/cg';
import ColumnImage from 'components/column-image';

const Brands = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { brands, meta, loading } = useSelector(
    (state) => state.brand,
    shallowEqual,
  );
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { setIsModalVisible } = useContext(Context);

  const [downloading, setDownloading] = useState(false);
  const [id, setId] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [text, setText] = useState(null);
  const [filters, setFilters] = useState({ page: 1, search: '' });
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      is_show: true,
    },
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
      is_show: true,
      render: (title) => title || t('N/A'),
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
            onClick={() => goToEdit(row)}
          />
          <Button icon={<CopyOutlined />} onClick={() => goToClone(row.id)} />
          <DeleteButton
            icon={<DeleteOutlined />}
            onClick={() => {
              setId([row.id]);
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

  const goToClone = (id) => {
    dispatch(
      addMenu({
        id: `brand-clone`,
        url: `brand-clone/${id}`,
        name: t('brand.clone'),
      }),
    );
    navigate(`/brand-clone/${id}`, { state: 'clone' });
  };

  const goToEdit = (row) => {
    dispatch(
      addMenu({
        url: `brand/${row.id}`,
        id: 'brand_edit',
        name: t('edit.brand'),
      }),
    );
    navigate(`/brand/${row.id}`, { state: 'edit' });
  };

  const goToAddBrand = () => {
    dispatch(
      addMenu({
        id: 'brand/add',
        url: 'brand/add',
        name: t('add.brand'),
      }),
    );
    navigate('/brand/add');
  };

  const goToImport = () => {
    dispatch(
      addMenu({
        url: `catalog/brands/import`,
        id: 'brand_import',
        name: t('import.brand'),
      }),
    );
    navigate(`/catalog/brands/import`);
  };

  const brandDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    brandService
      .delete(params)
      .then(() => {
        toast.success(t('successfully.deleted'));
        dispatch(setRefetch(activeMenu));
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
        setIsModalVisible(false);
        setText(null);
      });
  };

  const onChangePagination = (pagination) => {
    const { current: page } = pagination;
    handleFiltersChange({ page });
  };

  const excelExport = () => {
    setDownloading(true);
    brandService
      .export(params)
      .then((res) => {
        if (res?.data?.file_name) {
          window.location.href = `${export_url}${res?.data?.file_name}`;
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
      toast.warning(t('select.brand'));
    } else {
      setIsModalVisible(true);
      setText(false);
    }
  };

  const fetch = () => {
    dispatch(fetchBrands(params));
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
          <DeleteButton size='' onClick={allDelete}>
            {t('delete.selected')}
          </DeleteButton>
          <Button type='primary' onClick={goToAddBrand}>
            {t('add.brands')}
          </Button>
        </Space>
        <Divider />
        <Table
          scroll={{ x: true }}
          rowSelection={rowSelection}
          columns={columns?.filter((item) => item.is_show)}
          dataSource={brands}
          pagination={{
            showSizeChanger: false,
            pageSize: meta?.per_page || 10,
            current: meta?.current_page || 1,
            total: meta?.total || 0,
          }}
          rowKey={(record) => record.id}
          onChange={onChangePagination}
          loading={loading}
        />
      </Card>
      <CustomModal
        click={brandDelete}
        text={text ? t('delete') : t('delete.selected')}
        setText={setId}
        loading={loadingBtn}
      />
    </>
  );
};

export default Brands;
