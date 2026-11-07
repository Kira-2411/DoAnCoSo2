import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
  Edit,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAdminToast } from './AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import AdminModal from './AdminModal';
import AdminConfirmDialog from './AdminConfirmDialog';
import AdminFormField from './AdminFormField';
import AdminPagination from './AdminPagination';

const ROLE_BADGES = {
  ADMIN: {
    label: 'Quản trị viên (ADMIN)',
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    icon: ShieldAlert,
  },
  STAFF: {
    label: 'Nhân viên rạp (STAFF)',
    color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    icon: Shield,
  },
  CUSTOMER: {
    label: 'Khách hàng (CUSTOMER)',
    color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    icon: UserCheck,
  },
};

const AdminUsers = () => {
  const { showToast } = useAdminToast();
  let currentAuthUser = null;
  try {
    const auth = useAuth();
    currentAuthUser = auth.user;
  } catch (e) {
    // Nếu chưa bọc trong AuthProvider hoặc đang chạy độc lập
    currentAuthUser = null;
  }

  // ID của admin đang thao tác (mặc định 1 nếu chưa đăng nhập qua AuthContext)
  const currentUserId = currentAuthUser?.userId || 1;

  // Dữ liệu danh sách & phân trang
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({ totalPages: 1, totalElements: 0, size: 10 });

  // Bộ lọc
  const [roleFilter, setRoleFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Debounce tìm kiếm 300ms
  const searchTimerRef = useRef(null);
  const handleKeywordChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedKeyword(val);
      setPage(0);
    }, 300);
  };

  // Modal Sửa vai trò
  const [roleModalTarget, setRoleModalTarget] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('CUSTOMER');
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Confirm Khóa / Mở khóa
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Tải danh sách người dùng
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        role: roleFilter,
        keyword: debouncedKeyword,
        page,
        size: 10,
      });
      setUsers(res.content || []);
      setPagination({
        totalPages: res.totalPages || 1,
        totalElements: res.totalElements || 0,
        size: res.size || 10,
      });
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
      showToast('error', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, debouncedKeyword, page]);

  // Đếm số lượng Admin đang hoạt động để kiểm tra BR-ROLE-04
  const activeAdminsCount = users.filter((u) => u.role === 'ADMIN' && u.isActive).length;

  // Mở modal sửa vai trò
  const handleOpenRoleModal = (u) => {
    setRoleModalTarget(u);
    setSelectedNewRole(u.role);
    setRoleError('');
  };

  // Submit sửa vai trò
  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (!roleModalTarget) return;

    if (roleModalTarget.userId === currentUserId && selectedNewRole !== 'ADMIN') {
      setRoleError('Bạn không thể tự hạ quyền quản trị của chính mình (BR-ROLE-04)');
      return;
    }

    setRoleSubmitting(true);
    setRoleError('');

    try {
      await adminApi.updateUserRole(roleModalTarget.userId, selectedNewRole, currentUserId);
      showToast(
        'success',
        `Đã đổi vai trò của "${roleModalTarget.username}" thành ${ROLE_BADGES[selectedNewRole]?.label}`
      );
      setRoleModalTarget(null);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi đổi vai trò:', err);
      setRoleError(err.message || 'Không thể đổi vai trò người dùng');
      showToast('error', err.message || 'Lỗi đổi vai trò (BR-ROLE-04)');
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Xác nhận Khóa / Mở khóa
  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusLoading(true);

    try {
      const nextActive = !statusTarget.isActive;
      await adminApi.setUserActive(statusTarget.userId, nextActive, currentUserId);
      showToast(
        'success',
        nextActive
          ? `Đã mở khóa tài khoản cho "${statusTarget.username}"`
          : `Đã khóa tài khoản "${statusTarget.username}" thành công (BR-USER-02)`
      );
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi đổi trạng thái tài khoản:', err);
      showToast('error', err.message || 'Không thể thay đổi trạng thái tài khoản (BR-ROLE-04)');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" />
            Quản lý Người dùng & Phân quyền
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Tra cứu thông tin, phân quyền vai trò (Admin/Staff/Customer) và khóa tài khoản vi phạm (BR-USER-02, BR-ROLE-04)
          </p>
        </div>

        {/* Chú thích nguyên tắc bảo vệ tài khoản */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-xs text-zinc-300">
          <Info className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>Hệ thống áp dụng BR-ROLE-04: Không xóa cứng, bảo vệ tài khoản Admin cuối cùng</span>
        </div>
      </div>

      {/* Thanh bộ lọc & tìm kiếm */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={handleKeywordChange}
            placeholder="Tìm theo username, email, SĐT..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-rose-500 transition-colors"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="STAFF">Nhân viên (STAFF)</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
          </select>
        </div>
      </div>

      {/* Danh sách người dùng */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mb-2" />
          <p className="text-sm">Đang tải danh sách người dùng...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-zinc-300">Không tìm thấy người dùng nào</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Hãy thử tìm với từ khóa khác hoặc chuyển sang vai trò khác.
          </p>
        </div>
      ) : (
        <>
          {/* Bảng Desktop */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-800/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Mã</th>
                  <th className="px-4 py-3.5">Tên đăng nhập / Họ tên</th>
                  <th className="px-4 py-3.5">Email & SĐT</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5 text-center">Xác thực Email</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((item) => {
                  const roleConfig = ROLE_BADGES[item.role] || ROLE_BADGES.CUSTOMER;
                  const RoleIcon = roleConfig.icon;
                  const isSelf = item.userId === currentUserId;
                  const isLocked = !item.isActive;
                  const isProtectedAdmin =
                    item.role === 'ADMIN' && item.isActive && activeAdminsCount <= 1;

                  return (
                    <tr
                      key={item.userId}
                      className={`hover:bg-zinc-800/30 transition-colors ${
                        isLocked ? 'opacity-50 bg-zinc-950/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                        #{item.userId}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{item.username}</span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                              Chính bạn
                            </span>
                          )}
                        </div>
                        {item.fullName && (
                          <div className="text-xs text-zinc-400 mt-0.5">{item.fullName}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{item.email}</span>
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-zinc-400 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{item.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleConfig.color}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{item.role}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã xác thực</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Chưa xác thực</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sửa vai trò */}
                          <button
                            onClick={() => handleOpenRoleModal(item)}
                            title="Sửa vai trò"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Khóa / Mở khóa (BR-ROLE-04: không tự khóa chính mình, không khóa admin cuối cùng) */}
                          {item.isActive ? (
                            <button
                              onClick={() => setStatusTarget(item)}
                              disabled={isSelf || isProtectedAdmin}
                              title={
                                isSelf
                                  ? 'Không thể tự khóa chính mình (BR-ROLE-04)'
                                  : isProtectedAdmin
                                  ? 'Không thể khóa Admin cuối cùng của hệ thống (BR-ROLE-04)'
                                  : 'Khóa tài khoản'
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSelf || isProtectedAdmin
                                  ? 'text-zinc-600 cursor-not-allowed'
                                  : 'text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10'
                              }`}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatusTarget(item)}
                              title="Mở khóa tài khoản"
                              className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Dạng thẻ Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {users.map((item) => {
              const roleConfig = ROLE_BADGES[item.role] || ROLE_BADGES.CUSTOMER;
              const RoleIcon = roleConfig.icon;
              const isSelf = item.userId === currentUserId;
              const isLocked = !item.isActive;
              const isProtectedAdmin =
                item.role === 'ADMIN' && item.isActive && activeAdminsCount <= 1;

              return (
                <div
                  key={item.userId}
                  className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-3 ${
                    isLocked ? 'opacity-60 bg-zinc-950/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-base">{item.username}</h4>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Bạn
                          </span>
                        )}
                      </div>
                      {item.fullName && (
                        <p className="text-xs text-zinc-400 mt-0.5">{item.fullName}</p>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleConfig.color}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{item.role}</span>
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-300 bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 mt-1">
                      <span className="text-zinc-500">Trạng thái:</span>
                      {item.isActive ? (
                        <span className="text-emerald-400 font-medium">Đang hoạt động</span>
                      ) : (
                        <span className="text-rose-400 font-medium">Đã khóa</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
                    <button
                      onClick={() => handleOpenRoleModal(item)}
                      className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 text-xs flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Sửa quyền</span>
                    </button>

                    {item.isActive ? (
                      <button
                        onClick={() => setStatusTarget(item)}
                        disabled={isSelf || isProtectedAdmin}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 ${
                          isSelf || isProtectedAdmin
                            ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>Khóa</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatusTarget(item)}
                        className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>Mở khóa</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Phân trang */}
          <AdminPagination
            page={page}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            size={pagination.size}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Modal Sửa vai trò */}
      <AdminModal
        isOpen={Boolean(roleModalTarget)}
        onClose={() => setRoleModalTarget(null)}
        title={`Thay đổi vai trò: ${roleModalTarget?.username}`}
        description="Gán quyền hạn tương ứng cho tài khoản. Hãy thận trọng khi cấp quyền Quản trị viên (ADMIN)."
        size="md"
      >
        <form onSubmit={handleSubmitRole} className="space-y-4">
          {roleError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{roleError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs space-y-1">
            <p className="text-zinc-400">
              Tài khoản: <strong className="text-white">{roleModalTarget?.username}</strong> ({roleModalTarget?.email})
            </p>
            <p className="text-zinc-400">
              Vai trò hiện tại:{' '}
              <span className="font-semibold text-rose-400">{roleModalTarget?.role}</span>
            </p>
          </div>

          <AdminFormField label="Chọn vai trò mới" required>
            <div className="space-y-2">
              {[
                {
                  role: 'ADMIN',
                  title: 'ADMIN (Quản trị viên)',
                  desc: 'Toàn quyền quản trị: thêm/sửa/ẩn phim, suất chiếu, đồ ăn, tin tức, ưu đãi và phân quyền người dùng.',
                },
                {
                  role: 'STAFF',
                  title: 'STAFF (Nhân viên rạp)',
                  desc: 'Hỗ trợ kiểm tra vé, phục vụ quầy bắp nước và hỗ trợ vận hành rạp chiếu.',
                },
                {
                  role: 'CUSTOMER',
                  title: 'CUSTOMER (Khách hàng)',
                  desc: 'Người dùng thông thường, xem thông tin và đặt vé trực tuyến.',
                },
              ].map((opt) => {
                const isSelected = selectedNewRole === opt.role;
                return (
                  <div
                    key={opt.role}
                    onClick={() => setSelectedNewRole(opt.role)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                        : 'bg-zinc-800/60 border-zinc-700/80 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{opt.title}</span>
                      <input
                        type="radio"
                        name="newRole"
                        checked={isSelected}
                        onChange={() => setSelectedNewRole(opt.role)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setRoleModalTarget(null)}
              className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={roleSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all disabled:opacity-50"
            >
              {roleSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu vai trò</span>
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Confirm Khóa / Mở khóa tài khoản (BR-USER-02, BR-ROLE-04) */}
      <AdminConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.isActive ? 'Khóa tài khoản người dùng' : 'Mở khóa tài khoản người dùng'}
        message={
          statusTarget
            ? statusTarget.isActive
              ? `Tài khoản "${statusTarget.username}" sẽ bị khóa và không thể đăng nhập vào hệ thống. Các đơn đặt vé trước đó vẫn được lưu trữ nguyên vẹn (BR-USER-02). Bạn có chắc chắn muốn khóa tài khoản này?`
              : `Tài khoản "${statusTarget.username}" sẽ được mở khóa và người dùng có thể tiếp tục đăng nhập, sử dụng dịch vụ bình thường.`
            : ''
        }
        confirmText={statusTarget?.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy"
        danger={statusTarget?.isActive}
        loading={statusLoading}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default AdminUsers;

