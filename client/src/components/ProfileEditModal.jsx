import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useUpdateProfileMutation, useChangePasswordMutation, useDeleteAccountMutation, useLogoutMutation } from '../store/api'
import { updateUser, clearCredentials } from '../store/authSlice'

export default function ProfileEditModal({ user, onClose }) {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('profile')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation()
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()
  const [logout] = useLogoutMutation()

  const [form, setForm] = useState({
    fullName: user.fullName || '',
    college: user.college || '',
    branch: user.branch || '',
    graduationYear: user.graduationYear || new Date().getFullYear() + 1,
    level: user.level || 'fresher',
  })

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const res = await updateProfile(form).unwrap()
      dispatch(updateUser(res.user))
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.data?.message || 'Failed to update profile')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return setError('New passwords do not match')
    }
    try {
      await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }).unwrap()
      setSuccess('Password changed successfully!')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.data?.message || 'Failed to change password')
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteAccount().unwrap()
        await logout().unwrap()
        dispatch(clearCredentials())
        window.location.href = '/'
      } catch (err) {
        setError(err.data?.message || 'Failed to delete account')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6 pt-4 gap-6">
          <button 
            className={`pb-3 font-medium transition-colors ${activeTab === 'profile' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
          <button 
            className={`pb-3 font-medium transition-colors ${activeTab === 'security' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('security')}
          >
            Security & Data
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 rounded-lg text-sm">{success}</div>}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Experience Level</label>
                  <select 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                    value={form.level}
                    onChange={(e) => setForm({...form, level: e.target.value})}
                  >
                    <option value="fresher">Fresher</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Graduation Year</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                    value={form.graduationYear}
                    onChange={(e) => setForm({...form, graduationYear: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">College</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                  value={form.college}
                  onChange={(e) => setForm({...form, college: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Branch</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                  value={form.branch}
                  onChange={(e) => setForm({...form, branch: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isUpdating} className="px-6 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-lg transition-colors">
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-2">Change Password</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({...pwdForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({...pwdForm, newPassword: e.target.value})}
                    required minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-teal-400"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
                    required minLength={8}
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isChangingPwd} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg transition-colors">
                    {isChangingPwd ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>

              <div className="border-t border-red-500/30 pt-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-lg transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
