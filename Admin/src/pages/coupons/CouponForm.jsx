import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { couponService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const CouponForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minimumPurchase: 0,
    maximumDiscount: '',
    startDate: '',
    expiryDate: '',
    usageLimit: '',
    usagePerUser: 1,
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchCoupon();
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFormData((prev) => ({
        ...prev,
        startDate: today,
        expiryDate: nextMonth.toISOString().split('T')[0],
      }));
    }
  }, [id]);

  const fetchCoupon = async () => {
    try {
      const response = await couponService.getById(id);
      const coupon = response.data;

      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumPurchase: coupon.minimumPurchase,
        maximumDiscount: coupon.maximumDiscount || '',
        startDate: new Date(coupon.startDate).toISOString().split('T')[0],
        expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
        usageLimit: coupon.usageLimit || '',
        usagePerUser: coupon.usagePerUser,
        isActive: coupon.isActive,
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/coupons');
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
      };

      if (isEdit) {
        await couponService.update(id, data);
        toast.success('Coupon updated successfully');
      } else {
        await couponService.create(data);
        toast.success('Coupon created successfully');
      }

      navigate('/coupons');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader title={isEdit ? 'Edit Coupon' : 'Create Coupon'} />

      <div className="max-w-[800px] bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coupon Code */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
                maxLength="50"
                placeholder="e.g., SAVE20"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                           uppercase placeholder-gray-400 focus:outline-none focus:ring-2
                           focus:ring-black focus:border-black transition-all duration-200
                           tracking-widest font-mono text-lg"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2.5 border-2 border-black text-black text-sm font-semibold
                           rounded-md cursor-pointer hover:bg-black hover:text-white
                           transition-all duration-200 active:scale-95 flex items-center gap-2
                           whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0
                       004.582 9m0 0H9m11 11v-5h-.581m0
                       0a8.003 8.003 0 01-15.357-2m15.357
                       2H15"
                  />
                </svg>
                Generate
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Uppercase letters, numbers, hyphens and underscores only
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              placeholder="Brief description of this coupon..."
              maxLength="200"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200 resize-y"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Optional description</p>
              <p
                className={`text-xs font-medium ${
                  formData.description.length > 180
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              >
                {formData.description.length}/200
              </p>
            </div>
          </div>

          {/* Discount Type & Value */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195
                     1.414.586l7 7a2 2 0 010
                     2.828l-7 7a2 2 0
                     01-2.828 0l-7-7A1.994 1.994
                     0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Discount Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black text-sm appearance-none cursor-pointer focus:outline-none
                               focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-semibold">
                      {formData.discountType === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={
                      formData.discountType === 'percentage'
                        ? 100
                        : undefined
                    }
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: e.target.value,
                      })
                    }
                    required
                    placeholder={
                      formData.discountType === 'percentage'
                        ? '10'
                        : '10.00'
                    }
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-black focus:border-black transition-all duration-200
                               cursor-pointer"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.discountType === 'percentage'
                    ? 'Max 100%'
                    : 'Amount in USD'}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Minimum Purchase Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm font-semibold">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimumPurchase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumPurchase: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                             text-black placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-black focus:border-black transition-all duration-200
                             cursor-pointer"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum cart value to use this coupon
              </p>
            </div>

            {formData.discountType === 'percentage' && (
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Maximum Discount Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-semibold">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximumDiscount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumDiscount: e.target.value,
                      })
                    }
                    placeholder="No limit"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-black focus:border-black transition-all duration-200
                               cursor-pointer"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Cap the discount amount
                </p>
              </div>
            )}
          </div>

          {/* Validity Period */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0
                     002-2V7a2 2 0 00-2-2H5a2 2 0
                     00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Validity Period
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                             text-black focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200 cursor-pointer"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                  min={formData.startDate}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                             text-black focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0
                     00-2 2v6a2 2 0 002 2h2a2 2 0
                     002-2zm0 0V9a2 2 0 012-2h2a2
                     2 0 012 2v10m-6 0a2 2 0
                     002 2h2a2 2 0 002-2m0
                     0V5a2 2 0 012-2h2a2 2 0
                     012 2v14a2 2 0 01-2 2h-2a2
                     2 0 01-2-2z"
                />
              </svg>
              Usage Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                             text-black placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-black focus:border-black transition-all duration-200
                             cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum times this coupon can be used
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Usage Per User <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usagePerUser}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usagePerUser: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                             text-black placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-black focus:border-black transition-all duration-200
                             cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How many times each user can use this
                </p>
              </div>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="border-t border-gray-300 pt-6">
            <label
              htmlFor="isActive"
              className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-md
                         cursor-pointer hover:bg-gray-50 transition-colors duration-200 w-fit"
            >
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                id="isActive"
                className="w-4 h-4 accent-black cursor-pointer"
              />
              <div>
                <span className="text-sm font-semibold text-black select-none">
                  Active
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Users can apply this coupon at checkout
                </p>
              </div>
            </label>
          </div>

          {/* Preview Card */}
          {formData.code && (
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0
                       016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5
                       12 5c4.478 0 8.268 2.943
                       9.542 7-1.274 4.057-5.064
                       7-9.542 7-4.477
                       0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Preview
              </h3>

              <div
                className="relative overflow-hidden border-2 border-dashed border-gray-300
                            rounded-lg p-6 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-mono font-bold tracking-widest text-black">
                      {formData.code}
                    </p>
                    {formData.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-black">
                      {formData.discountValue
                        ? formData.discountType === 'percentage'
                          ? `${formData.discountValue}%`
                          : `$${formData.discountValue}`
                        : '—'}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      {formData.discountType === 'percentage'
                        ? 'Percent Off'
                        : 'Flat Off'}
                    </p>
                  </div>
                </div>

                {(formData.minimumPurchase > 0 || formData.startDate) && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
                    {formData.minimumPurchase > 0 && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        Min. purchase: ${formData.minimumPurchase}
                      </span>
                    )}
                    {formData.startDate && formData.expiryDate && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        Valid: {formData.startDate} → {formData.expiryDate}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => navigate('/coupons')}
              className="flex-1 py-3 px-6 bg-white text-black border-2 border-black rounded-md
                         font-semibold cursor-pointer hover:bg-gray-100
                         transition-all duration-200 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all duration-200
                         active:scale-[0.98] ${
                           loading
                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                             : 'bg-black text-white border-2 border-black cursor-pointer hover:bg-gray-800'
                         }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0
                         5.373 0 12h4zm2 5.291A7.962
                         7.962 0 014 12H0c0 3.042 1.135
                         5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : isEdit ? (
                'Update Coupon'
              ) : (
                'Create Coupon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponForm;