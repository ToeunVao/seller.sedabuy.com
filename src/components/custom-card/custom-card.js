import cls from './custom-card.module.scss';
import Loading from '../loading';

export const CustomCard = ({
  title,
  className = '',
  extra,
  loading = false,
  children,
}) => {
  return (
    <div className={`${cls.container} ${className}`}>
      {Boolean(title || extra) && (
        <div className={cls.header}>
          {title && <h2 className={cls.title}>{title}</h2>}
          {extra}
        </div>
      )}
      <div className={cls.content}>{loading ? <Loading /> : children}</div>
    </div>
  );
};
