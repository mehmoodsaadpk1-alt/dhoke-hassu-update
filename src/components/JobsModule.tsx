/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  PlusCircle, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  Image as ImageIcon, 
  CheckCircle, 
  Tag, 
  Bookmark, 
  Share2, 
  FileText, 
  UploadCloud, 
  X, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { JobItem, JobApplication, Language, AdItem } from '../types';
import { dbGetActiveAds } from '../utils/supabaseClient';
import AdBannerCard from './AdBannerCard';
import { useAdRotator } from '../hooks/useAdRotator';
import { useAdStore } from '../store/adStore';
import { getCurrentUserLocation } from '../utils/locationService';
import { analytics } from '../services/AnalyticsService';

const viewedJobs = new Set<string>();

interface JobsModuleProps {
  jobs: JobItem[];
  onAddJob: (job: JobItem) => void;
  currentLanguage: Language;
  onNavigateToPost: () => void;
  onNavigateToList: () => void;
  onNavigateToDetail: (jobId: string) => void;
  onNavigateToApplications?: () => void;
  selectedJobId: string | null;
  activeView: 'list' | 'detail' | 'post' | 'applications';
}
export default function JobsModule({
  jobs,
  onAddJob,
  currentLanguage,
  onNavigateToPost,
  onNavigateToList,
  onNavigateToDetail,
  onNavigateToApplications,
  selectedJobId,
  activeView
}: JobsModuleProps) {
const jobsFeedAdInterval = useAdStore(s => s.feedAdIntervals?.['Jobs'] || 3);
const jobsBannerMap = useAdRotator('Jobs', 1, 1, 'Banner');
const jobsAdMap = useAdRotator('Jobs', 200, jobsFeedAdInterval, 'Feed');
    const isEn = currentLanguage === 'en';

    if (activeView === 'detail' && selectedJobId) {
      if (!viewedJobs.has(selectedJobId)) {
        viewedJobs.add(selectedJobId);
        analytics.track("job_view", { entity_type: 'job',
          module: "jobs",
          entity_id: selectedJobId
        });
      }
    }

    // Legacy ad load removed - Ads are fetched via useAdRotator hook


  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  // ----------------- LIST FILTER STATES -----------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories list (exactly as requested in User Prompt)
  const categories = [
    'All',
    'Full Time',
    'Part Time',
    'Internship',
    'Remote',
    'Freelance',
    'Daily Wage',
    'Other'
  ];

  // ----------------- POST JOB FORM STATES -----------------
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formCategory, setFormCategory] = useState('Full Time');
  const [formSalary, setFormSalary] = useState('');
  const [formLocation, setFormLocation] = useState('Dhoke Hassu');
  const [formContact, setFormContact] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formImage, setFormImage] = useState('');
  const [postErrors, setPostErrors] = useState<Record<string, string>>({});
  const [postSuccess, setPostSuccess] = useState(false);

  // ----------------- APPLY FORM MODAL STATES -----------------
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyingJob, setApplyingJob] = useState<JobItem | null>(null);
  const [applyFormName, setApplyFormName] = useState('');
  const [applyFormContact, setApplyFormContact] = useState('');
  const [applyFormMessage, setApplyFormMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [applySuccess, setApplySuccess] = useState(false);

  // ----------------- TOAST/ALERT STATES -----------------
  const [shareToast, setShareToast] = useState<string | null>(null);

  // ----------------- ACTION HANDLERS -----------------
  const toggleSaveJob = (jobId: string) => {
    if (savedJobIds.includes(jobId)) {
      setSavedJobIds(savedJobIds.filter(id => id !== jobId));
      showToast(isEn ? 'Job removed from bookmarks!' : 'نوکری بک مارک سے ہٹا دی گئی!');
    } else {
      setSavedJobIds([...savedJobIds, jobId]);
      showToast(isEn ? 'Job successfully bookmarked!' : 'نوکری کامیابی سے محفوظ کر لی گئی!');
    }
  };

  const showToast = (message: string) => {
    setShareToast(message);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleShare = (job: JobItem) => {
    const jobUrl = `${window.location.origin}/jobs/detail?id=${job.id}`;
    navigator.clipboard.writeText(jobUrl);
    
    analytics.track("job_share", { entity_type: 'job',
      module: "jobs",
      entity_id: job.id
    });
    
    showToast(isEn ? 'Job link copied to clipboard!' : 'نوکری کا لنک کاپی ہو گیا!');
  };

  const openApplyModal = (job: JobItem) => {
    // Check duplicate first
    const alreadyApplied = applications.some(app => app.jobId === job.id);
    if (alreadyApplied) {
      alert(isEn 
        ? 'Duplicate Prevention: You have already applied to this job opportunity!' 
        : 'رکورڈ کی حفاظت: آپ اس ملازمت کے لیے پہلے ہی درخواست جمع کرا چکے ہیں!'
      );
      return;
    }

    setApplyingJob(job);
    setApplyFormName('');
    setApplyFormContact('');
    setApplyFormMessage('');
    setUploadedFileName(null);
    setApplyErrors({});
    setApplySuccess(false);
    setApplyModalOpen(true);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
    }
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    const newErrors: Record<string, string> = {};
    if (!applyFormName?.trim()) {
      newErrors.name = isEn ? 'Name is required' : 'نام درج کرنا لازمی ہے';
    }
    if (!applyFormContact?.trim()) {
      newErrors.contact = isEn ? 'Contact number is required' : 'رابطہ نمبر درج کرنا لازمی ہے';
    }

    if (Object.keys(newErrors).length > 0) {
      setApplyErrors(newErrors);
      return;
    }

    const newApplication: JobApplication = {
      id: `app-${Date.now()}`,
      jobId: applyingJob.id,
      jobTitle: applyingJob.title,
      company: applyingJob.company,
      applicantName: applyFormName,
      contactNumber: applyFormContact,
      resumeName: uploadedFileName || undefined,
      message: applyFormMessage || undefined,
      appliedDate: new Date().toLocaleDateString(isEn ? 'en-US' : 'ur-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      status: 'Applied'
    };

    setApplications([newApplication, ...applications]);
    setApplySuccess(true);
      
    analytics.track("job_apply", { entity_type: 'job',
      module: "jobs",
      entity_id: applyingJob.id
    });
      
    analytics.track("job_contact", { entity_type: 'job',
      module: "jobs",
      entity_id: applyingJob.id,
      metadata: {
        contact_type: 'chat'
      }
    });

    setTimeout(() => {
      setApplyModalOpen(false);
      setApplySuccess(false);
      
      if ((window as any).openChat) {
        const firstMsg = isEn
          ? `Hi, I'm applying for the job "${applyingJob.title}" at "${applyingJob.company}".\n\nName: ${applyFormName}\nContact: ${applyFormContact}\nMessage: ${applyFormMessage || 'N/A'}`
          : `السلام علیکم، میں "${applyingJob.company}" میں نوکری "${applyingJob.title}" کے لیے درخواست دے رہا ہوں۔\n\nنام: ${applyFormName}\nرابطہ: ${applyFormContact}\nتفصیل: ${applyFormMessage || 'لاگو نہیں'}`;
        (window as any).openChat(applyingJob.contact || applyingJob.postedBy || 'employer', applyingJob.company, '', firstMsg);
      } else if (onNavigateToApplications) {
        onNavigateToApplications();
      }
    }, 2000);
  };

  const handlePostJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formTitle?.trim()) {
      newErrors.title = isEn ? 'Job Title is required' : 'نوکری کا عنوان ضروری ہے';
    }
    if (!formCompany?.trim()) {
      newErrors.company = isEn ? 'Company / Employer Name is required' : 'کمپنی یا آجر کا نام ضروری ہے';
    }
    if (!formSalary?.trim()) {
      newErrors.salary = isEn ? 'Salary information is required' : 'تنخواہ کی معلومات ضروری ہے';
    }
    if (!formLocation?.trim()) {
      newErrors.location = isEn ? 'Area/Location is required' : 'ملازمت کا علاقہ ضروری ہے';
    }
    if (!formContact?.trim()) {
      newErrors.contact = isEn ? 'Contact number is required' : 'رابطہ فون نمبر ضروری ہے';
    }
    if (!formDescription?.trim()) {
      newErrors.description = isEn ? 'Job description is required' : 'نوکری کی تفصیل ضروری ہے';
    }

    if (Object.keys(newErrors).length > 0) {
      setPostErrors(newErrors);
      return;
    }

    setPostErrors({});

    const newJob: JobItem = {
      id: `job-${Date.now()}`,
      title: formTitle,
      company: formCompany,
      salary: formSalary,
      type: formCategory,
      postedBy: 'You (Owner)',
      contact: formContact,
      area: formLocation,
      postedTime: isEn ? 'Just now' : 'ابھی ابھی',
      description: formDescription,
      requirements: formRequirements || undefined,
      deadline: formDeadline || undefined,
      image: formImage || undefined,
      category: formCategory
    };

    onAddJob(newJob);

    analytics.track("job_create", { entity_type: 'job',
      module: "jobs",
      entity_id: newJob.id,
      metadata: {
        category: newJob.category,
        employment_type: newJob.type
      }
    });

    setPostSuccess(true);
    onNavigateToList();

    // Reset fields
    setFormTitle('');
    setFormCompany('');
    setFormCategory('Full Time');
    setFormSalary('');
    setFormLocation('Dhoke Hassu');
    setFormContact('');
    setFormDescription('');
    setFormRequirements('');
    setFormDeadline('');
    setFormImage('');

    setTimeout(() => {
      setPostSuccess(false);
      onNavigateToList();
    }, 2000);
  };

  // ----------------- RESOLVE CURRENT JOB -----------------
  const currentJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // ----------------- FILTER LIST LOGIC -----------------
  const userLoc = getCurrentUserLocation();
  const filteredJobs = jobs.filter(job => {
    const matchesLocation = !job.area || job.area?.toLowerCase() === userLoc?.toLowerCase();
    if (!matchesLocation) return false;

    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery?.toLowerCase()) || 
      job.company?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
      (job.description && job.description?.toLowerCase().includes(searchQuery?.toLowerCase())) ||
      (job.area && job.area?.toLowerCase().includes(searchQuery?.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory || job.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 animate-fade-in" id="jobs-module-stage">
      
      {/* Top Banner Ad Segment */}
      {jobsBannerMap[0] && (
        <div className="mb-6">
          <AdBannerCard ad={jobsBannerMap[0]} />
        </div>
      )}

      {/* Toast Alert Notification */}
      {shareToast && (
        <div className="fixed bottom-6 end-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 text-xs font-bold animate-bounce" id="jobs-toast-notification">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* SUB-NAVIGATION MODULE NAVIGATION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-2.5 shadow-xs mb-6 flex flex-wrap gap-1 items-center justify-between" id="jobs-sub-tabs">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={onNavigateToList}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'list' || activeView === 'detail'
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-600'
            }`}
            id="sub-tab-browse-jobs"
          >
            <Briefcase className="w-4 h-4" />
            <span>{isEn ? 'Browse Jobs' : 'نوکریاں تلاش کریں'}</span>
          </button>

          <button
            onClick={onNavigateToPost}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'post'
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-50 text-slate-600'
            }`}
            id="sub-tab-post-job"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isEn ? 'Post a Job' : 'نوکری پوسٹ کریں'}</span>
          </button>
        </div>

        <button
          onClick={onNavigateToApplications}
          className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer border-0 ${
            activeView === 'applications'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
          id="sub-tab-my-applications"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{isEn ? 'My Applications' : 'میری درخواستیں'}</span>
          {applications.length > 0 && (
            <span className="bg-white text-emerald-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs">
              {applications.length}
            </span>
          )}
        </button>
      </div>

      {/* ----------------- JOBS LIST VIEW ----------------- */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Header Area */}
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl font-black text-slate-950 flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-emerald-600" />
              {isEn ? 'Local Jobs Portal' : 'لوکل نوکریوں کا پورٹل'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isEn 
                ? 'Find employment, part-time opportunities, and daily wage work in Dhoke Hassu.' 
                : 'ڈھوک حسو میں نوکریاں، پارٹ ٹائم کام اور دیہاڑی کے بہترین مواقع تلاش کریں۔'}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative" id="jobs-search-bar-wrap">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? 'Search jobs by title, company, skills, area...' : 'نوکری کا عنوان، کمپنی، ہنر یا علاقہ تلاش کریں...'}
              className="w-full ps-11 pe-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 transition-all shadow-xs"
              id="jobs-search-input-field"
            />
          </div>

          {/* Category Chip Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none" id="jobs-categories-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
                id={`cat-chip-${cat.replace(/\s+/g, '-')?.toLowerCase()}`}
              >
                {cat === 'All' && (isEn ? 'All Categories' : 'تمام اقسام')}
                {cat === 'Full Time' && (isEn ? 'Full Time' : 'فل ٹائم')}
                {cat === 'Part Time' && (isEn ? 'Part Time' : 'پارٹ ٹائم')}
                {cat === 'Internship' && (isEn ? 'Internship' : 'انٹرنشپ')}
                {cat === 'Remote' && (isEn ? 'Remote' : 'ریموٹ')}
                {cat === 'Freelance' && (isEn ? 'Freelance' : 'فری لانس')}
                {cat === 'Daily Wage' && (isEn ? 'Daily Wage' : 'روزانہ اجرت (دیہاڑی)')}
                {cat === 'Other' && (isEn ? 'Other' : 'دیگر')}
              </button>
            ))}
          </div>

          {/* Jobs Listing Grid: Desktop -> 2 Columns, Mobile -> 1 Column. Vertical cards only. */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 shadow-xs" id="jobs-empty-container">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-base font-bold text-slate-800">
                {isEn ? 'No job listings found' : 'کوئی نوکری نہیں ملی'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {isEn 
                  ? 'Try clearing search filters or check back later for new employment opportunities.' 
                  : 'براہ کرم سرچ کیورڈ تبدیل کریں یا نئی آسامیوں کے لیے بعد میں دوبارہ چیک کریں۔'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="jobs-vertical-list-grid">
              {(() => {
                const elements = [];
                for (let i = 0; i < filteredJobs.length; i++) {
                  const job = filteredJobs[i];
                  const isSaved = savedJobIds.includes(job.id);
                  const ad = jobsAdMap[i];

                  elements.push(
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between shadow-xs relative"
                      id={`job-card-${job.id}`}
                    >
                      <div className="space-y-3.5">
                        {/* Category and Bookmark Action */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <Tag className="w-2.5 h-2.5" />
                            {job.category || 'Other'}
                          </span>

                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                              isSaved
                                ? 'bg-red-50 border-red-100 text-red-500'
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'
                            }`}
                            title={isEn ? 'Save Job' : 'نوکری محفوظ کریں'}
                            id={`btn-save-job-${job.id}`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500' : ''}`} />
                          </button>
                        </div>

                        {/* Title & Employer */}
                        <div>
                          <h3 
                            onClick={() => onNavigateToDetail(job.id)}
                            className="font-extrabold text-slate-900 text-base hover:text-emerald-600 cursor-pointer transition-colors leading-tight line-clamp-2"
                          >
                            {job.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold mt-1">
                            🏢 {job.company}
                          </p>
                        </div>

                        {/* Location & Salary Information */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/50 px-2.5 py-2 rounded-2xl">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-2 rounded-2xl">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{job.area || 'Dhoke Hassu'}</span>
                          </div>
                        </div>

                        {/* Short Description */}
                        {job.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Buttons: View, Apply, Save */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-4">
                        <button
                          onClick={() => onNavigateToDetail(job.id)}
                          className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                          id={`btn-view-${job.id}`}
                        >
                          {isEn ? 'View Details' : 'تفصیل دیکھیں'}
                        </button>

                        <button
                          onClick={() => openApplyModal(job)}
                          className="flex-1 py-2 px-3 bg-[#2563eb] hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer border-0"
                          id={`btn-apply-${job.id}`}
                        >
                          {isEn ? 'Apply Now' : 'اپلائی کریں'}
                        </button>
                      </div>

                      {/* Posted Date */}
                      <div className="absolute top-4 end-14 text-[9px] text-slate-400 font-semibold flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-300" />
                        {job.postedTime || '1 day ago'}
                      </div>
                    </div>
                  );

                  // Inject Jobs placement active ad
                  if (ad) {
                    elements.push(
                      <div key={`ad-jobs-${i}-${ad.id}`} className="md:col-span-2">
                        <AdBannerCard ad={ad} />
                      </div>
                    );
                  }
                }
                return elements;
              })()}
            </div>
          )}
        </div>
      )}

      {/* ----------------- JOB DETAIL VIEW ----------------- */}
      {activeView === 'detail' && currentJob && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-6" id="job-detail-stage">
          {/* Top Row with Back Action */}
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateToList}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-2xl transition-all cursor-pointer"
              id="btn-detail-back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? 'Back to Jobs' : 'فہرست پر واپس جائیں'}</span>
            </button>

            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isEn ? `Posted: ${currentJob.postedTime || 'Recently'}` : `شائع شدہ: ${currentJob.postedTime || 'حال ہی میں'}`}
            </span>
          </div>

          {/* Job Main Header */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                {currentJob.category || 'Other'}
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
                {currentJob.type || 'Full Time'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {currentJob.title}
            </h1>
            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              🏢 {currentJob.company}
            </p>
          </div>

          {/* Key Information Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100/30 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-1">
                {isEn ? 'Monthly Salary' : 'ماہانہ تنخواہ'}
              </span>
              <span className="text-base font-extrabold text-blue-800">
                {currentJob.salary}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                {isEn ? 'Area/Location' : 'کام کا مقام'}
              </span>
              <span className="text-base font-extrabold text-slate-800 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                {currentJob.area || 'Dhoke Hassu'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                {isEn ? 'Application Deadline' : 'درخواست کی آخری تاریخ'}
              </span>
              <span className="text-base font-extrabold text-slate-800 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                {currentJob.deadline || (isEn ? 'Open' : 'جاری ہے')}
              </span>
            </div>
          </div>

          {/* Cover Graphic / Image */}
          {currentJob.image && (
            <div className="w-full flex justify-center mt-3 bg-slate-50 border-t border-b border-slate-100">
              <div className="w-full max-w-[700px] relative">
                <img src={currentJob.image} alt={currentJob.title} className="w-full rounded-2xl max-h-[500px] object-contain block" />
              </div>
            </div>
          )}

          {/* Description Block */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              📝 {isEn ? 'Job Description' : 'تفصیل ملازمت'}
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {currentJob.description || (isEn 
                ? 'No description provided.' 
                : 'تفصیل فراہم نہیں کی گئی۔')}
            </p>
          </div>

          {/* Requirements Block (New Field!) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              ⚡ {isEn ? 'Requirements / Skills Needed' : 'لازمی ضروریات اور ہنر'}
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {currentJob.requirements || (isEn 
                ? 'Basic literacy, discipline, good behavior, and familiarity with Dhoke Hassu layout.' 
                : 'بنیادی تعلیم، ڈسپلن، اچھا رویہ، اور ڈھوک حسو کے راستوں کی معلومات۔')}
            </p>
          </div>

          {/* Organizer / Contact Section */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3" id="job-contact-box">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              📞 {isEn ? 'Employer Contact Information' : 'آجر کے رابطے کی تفصیلات'}
            </h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                  data-profile-name={currentJob.postedBy}
                >
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">{isEn ? 'Posted By' : 'پوسٹ کنندہ'}</span>
                  <span 
                    className="text-sm font-bold text-slate-800 cursor-pointer hover:text-emerald-600 hover:underline transition-colors"
                    data-profile-name={currentJob.postedBy}
                  >
                    {currentJob.postedBy}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase sm:text-end">{isEn ? 'Contact Number' : 'رابطہ فون'}</span>
                <span className="text-sm font-extrabold text-slate-900 font-mono block sm:text-end">{currentJob.contact}</span>
              </div>
            </div>
          </div>

          {/* Detail Actions: Apply, Share, Save */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => openApplyModal(currentJob)}
              className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xs hover:shadow transition-all cursor-pointer border-0 flex items-center justify-center gap-2"
              id="detail-apply-btn"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEn ? 'Apply For This Position' : 'اس پوزیشن کے لیے درخواست دیں'}</span>
            </button>

            <button
              onClick={() => handleShare(currentJob)}
              className="px-5 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              id="detail-share-btn"
            >
              <Share2 className="w-4 h-4" />
              <span>{isEn ? 'Share Job' : 'اشتراک کریں'}</span>
            </button>

            <button
              onClick={() => toggleSaveJob(currentJob.id)}
              className={`px-5 py-3.5 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                savedJobIds.includes(currentJob.id)
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
              id="detail-bookmark-btn"
            >
              <Bookmark className="w-4 h-4" />
              <span>{savedJobIds.includes(currentJob.id) ? (isEn ? 'Saved' : 'محفوظ شدہ') : (isEn ? 'Save' : 'محفوظ کریں')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------- POST JOB VIEW ----------------- */}
      {activeView === 'post' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-6" id="job-post-stage">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              {isEn ? 'Publish Job Vacancy' : 'ملازمت کا اشتہار شائع کریں'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isEn 
                ? 'Fill in the fields to reach verified active job seekers in Dhoke Hassu.' 
                : 'ڈھوک حسو میں نوکری تلاش کرنے والے رہائشیوں تک پہنچنے کے لیے تمام معلومات فراہم کریں۔'}
            </p>
          </div>

          {postSuccess ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3" id="post-success-banner">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-800">
                {isEn ? 'Job Published Successfully!' : 'نوکری کامیابی سے شائع ہو گئی ہے!'}
              </h3>
              <p className="text-xs text-emerald-600">
                {isEn ? 'Redirecting you back to the active listings feed...' : 'کامیابی! نوکریوں کی لسٹ کی طرف واپس لے جایا جا رہا ہے...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePostJobSubmit} className="space-y-5" id="post-job-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Job Title' : 'نوکری کا عنوان'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={isEn ? 'e.g., Security Guard / Store Assistant' : 'مثال کے طور پر: سیکیورٹی گارڈ'}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${postErrors.title ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  />
                  {postErrors.title && <p className="text-[11px] text-red-500 font-bold">{postErrors.title}</p>}
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Company / Employer Name' : 'کمپنی / آجر کا نام'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder={isEn ? 'e.g., Rawal Medical Plaza' : 'مثال کے طور پر: راول میڈیکل پلازہ'}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${postErrors.company ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  />
                  {postErrors.company && <p className="text-[11px] text-red-500 font-bold">{postErrors.company}</p>}
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Job Type / Category' : 'ملازمت کی قسم/قسم'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 transition-all"
                  >
                    {categories.filter(c => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'Full Time' && (isEn ? 'Full Time' : 'فل ٹائم')}
                        {cat === 'Part Time' && (isEn ? 'Part Time' : 'پارٹ ٹائم')}
                        {cat === 'Internship' && (isEn ? 'Internship' : 'انٹرنشپ')}
                        {cat === 'Remote' && (isEn ? 'Remote' : 'ریموٹ')}
                        {cat === 'Freelance' && (isEn ? 'Freelance' : 'فری لانس')}
                        {cat === 'Daily Wage' && (isEn ? 'Daily Wage' : 'روزانہ اجرت (دیہاڑی)')}
                        {cat === 'Other' && (isEn ? 'Other / Miscellaneous' : 'دیگر')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salary Info */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Salary Offer' : 'پیش کش تنخواہ'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    placeholder={isEn ? 'e.g., PKR 30,000 / month' : 'مثال کے طور پر: 30,000 روپے ماہانہ'}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${postErrors.salary ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  />
                  {postErrors.salary && <p className="text-[11px] text-red-500 font-bold">{postErrors.salary}</p>}
                </div>

                {/* Area Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Area / Location' : 'علاقہ / مقام'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${postErrors.location ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  />
                  {postErrors.location && <p className="text-[11px] text-red-500 font-bold">{postErrors.location}</p>}
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Contact Phone Number' : 'رابطہ فون نمبر'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="e.g., 0300-5551234"
                    className={`w-full px-4 py-2.5 bg-slate-50 border ${postErrors.contact ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all`}
                  />
                  {postErrors.contact && <p className="text-[11px] text-red-500 font-bold">{postErrors.contact}</p>}
                </div>

                {/* Application Deadline */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isEn ? 'Application Deadline' : 'درخواست جمع کرانے کی آخری تاریخ'}
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all"
                  />
                </div>

                {/* Optional Cover Image */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    {isEn ? 'Optional Job Cover Image URL' : 'اختیاری تصویر کا لنک'}
                  </label>
                  <input
                    type="url"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Paste Unsplash image URL or leave blank"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all"
                  />
                </div>
              </div>

              {/* Requirements (New Field!) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Job Requirements & Skills Needed' : 'ہنر اور دیگر ضروریات'}
                </label>
                <textarea
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  placeholder={isEn ? 'e.g., Must have own transport, active CNIC, 2+ years experience...' : 'مثال کے طور پر: ذاتی موٹرسائیکل کا ہونا لازمی ہے، شناختی کارڈ کی کاپی اور تجربہ...'}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all resize-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Full Job Description' : 'ملازمت کی مکمل تفصیل'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={isEn ? 'Provide thorough detail about job responsibilities, work hours...' : 'ملازمت کی ذمہ داریوں اور کام کے اوقات کے متعلق تفصیل درج کریں...'}
                  rows={4}
                  className={`w-full px-4 py-3 bg-slate-50 border ${postErrors.description ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 transition-all resize-none`}
                />
                {postErrors.description && <p className="text-[11px] text-red-500 font-bold">{postErrors.description}</p>}
              </div>

              {/* Buttons: Publish Job, Cancel */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-xs hover:shadow transition-all cursor-pointer text-center border-0"
                  id="btn-publish-job"
                >
                  {isEn ? 'Publish Job Opportunity' : 'نوکری شائع کریں'}
                </button>
                <button
                  type="button"
                  onClick={onNavigateToList}
                  className="px-6 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'منسوخ کریں'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ----------------- APPLICATIONS VIEW ----------------- */}
      {activeView === 'applications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-xs space-y-6" id="job-applications-stage">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              {isEn ? 'My Sent Applications' : 'میری بھیجی گئی درخواستیں'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isEn 
                ? 'Track status and details of job applications you have sent in Dhoke Hassu Connect.' 
                : 'ڈھوک حسو کنیکٹ میں بھیجی گئی نوکری کی درخواستوں کے سٹیٹس اور معلومات کو ٹریک کریں۔'}
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-16" id="applications-empty-box">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-base font-bold text-slate-800">
                {isEn ? 'No applications submitted' : 'ابھی تک کوئی درخواست جمع نہیں کی گئی'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
                {isEn 
                  ? 'Browse through the job listings to apply for local work opportunities.' 
                  : 'علاقائی کام تلاش کرنے اور اپلائی کرنے کے لیے نوکریوں کی لسٹ دیکھیں۔'}
              </p>
              <button
                onClick={onNavigateToList}
                className="inline-flex items-center justify-center py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer border-0"
              >
                {isEn ? 'Explore Jobs' : 'نوکریاں تلاش کریں'}
              </button>
            </div>
          ) : (
            <div className="space-y-4" id="applications-sent-list">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 bg-slate-5/30 hover:bg-slate-50/50 rounded-2xl border border-slate-200/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {isEn ? app.status : 'درخواست جمع ہو گئی'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                        📅 {app.appliedDate}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {app.jobTitle}
                    </h4>
                    
                    <p className="text-xs text-slate-500 font-bold">
                      🏢 {app.company}
                    </p>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-3 rounded-2xl border border-slate-100/80 mt-2 max-w-xl shadow-3xs">
                      <p><span className="text-slate-400 font-bold">{isEn ? 'Applicant:' : 'درخواست دہندہ:'}</span> {app.applicantName} • <span className="font-mono">{app.contactNumber}</span></p>
                      {app.resumeName && (
                        <p className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>CV: {app.resumeName}</span>
                        </p>
                      )}
                      {app.message && (
                        <p className="italic text-slate-500 border-s-2 border-slate-200 ps-2 mt-1">{app.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToDetail(app.jobId)}
                      className="py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      {isEn ? 'View Original Job' : 'نوکری کا اشتہار دیکھیں'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- APPLY FORM MODAL DIALOG ----------------- */}
      {applyModalOpen && applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" id="apply-modal">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col justify-between max-h-[90vh]" id="apply-modal-box">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  {isEn ? 'Submit Job Application' : 'ملازمت کی درخواست جمع کروائیں'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md">
                  {applyingJob.title} • {applyingJob.company}
                </p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                id="close-apply-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-start">
              {applySuccess ? (
                <div className="p-8 text-center space-y-3" id="apply-success-box">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-800">
                    {isEn ? 'Application Submitted Successfully!' : 'درخواست کامیابی سے جمع ہو گئی ہے!'}
                  </h4>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    {isEn 
                      ? 'Your profile details have been securely logged. The employer has been notified!' 
                      : 'آپ کی تفصیلات کامیابی سے درج کر لی گئی ہیں۔ آجر کو مطلع کر دیا گیا ہے!'}
                  </p>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="space-y-4" id="modal-apply-form">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isEn ? 'Full Name' : 'درخواست دہندہ کا نام'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={applyFormName}
                      onChange={(e) => setApplyFormName(e.target.value)}
                      placeholder={isEn ? 'e.g., Muhammad Ali' : 'مثال کے طور پر: محمد علی'}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${applyErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100/50 transition-all`}
                    />
                    {applyErrors.name && <p className="text-[10px] text-red-500 font-bold">{applyErrors.name}</p>}
                  </div>

                  {/* Contact Number field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isEn ? 'Contact Mobile Number' : 'رابطہ موبائل نمبر'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={applyFormContact}
                      onChange={(e) => setApplyFormContact(e.target.value)}
                      placeholder={isEn ? 'e.g., 0300-5551122' : 'مثال کے طور پر: 03005551122'}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${applyErrors.contact ? 'border-red-400' : 'border-slate-200 focus:border-emerald-500'} rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100/50 transition-all`}
                    />
                    {applyErrors.contact && <p className="text-[10px] text-red-500 font-bold">{applyErrors.contact}</p>}
                  </div>

                  {/* Resume Upload field (Drag-and-Drop + Manual Click) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isEn ? 'Upload Resume / CV (Optional)' : 'ملازمت کی درخواست / سی وی (اختیاری)'}
                    </label>
                    
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                        isDragging 
                          ? 'border-emerald-500 bg-emerald-50/50' 
                          : uploadedFileName 
                          ? 'border-emerald-400 bg-emerald-50/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <input
                        type="file"
                        id="resume-file-picker"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="resume-file-picker" className="cursor-pointer block space-y-2">
                        <UploadCloud className={`w-8 h-8 mx-auto ${uploadedFileName ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <div className="text-xs">
                          {uploadedFileName ? (
                            <span className="font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              {uploadedFileName}
                            </span>
                          ) : (
                            <p className="text-slate-500">
                              <span className="font-bold text-emerald-600">{isEn ? 'Click to upload' : 'بٹن دبائیں'}</span> {isEn ? 'or drag and drop your CV here' : 'یا اپنی سی وی کی فائل یہاں کھینچ کر لائیں'}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">PDF, DOC, DOCX, PNG, JPG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  {/* Short Message field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {isEn ? 'Short Message to Employer' : 'آجر کے نام مختصر پیغام'}
                    </label>
                    <textarea
                      value={applyFormMessage}
                      onChange={(e) => setApplyFormMessage(e.target.value)}
                      placeholder={isEn ? 'Briefly mention why you are a good fit for this job...' : 'مختصر بیان کریں کہ آپ اس نوکری کے لیے کیوں موزوں ہیں...'}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100/50 transition-all resize-none"
                    />
                  </div>

                  {/* Submit and Cancel Buttons */}
                  <div className="flex items-center gap-2 pt-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-xs cursor-pointer border-0"
                      id="btn-submit-application"
                    >
                      {isEn ? 'Submit Application' : 'درخواست جمع کروائیں'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setApplyModalOpen(false)}
                      className="px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'کینسل کریں'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

