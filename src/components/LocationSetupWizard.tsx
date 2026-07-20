import React, { useState, useEffect } from 'react';
import { City, Area, User, Language } from '../types';
import { 
  dbGetCities, 
  dbGetAreas, 
  detectBrowserLocation, 
  findNearestArea 
} from '../utils/locationService';
import { MapPin, Globe, Compass, CheckCircle } from 'lucide-react';

interface LocationSetupWizardProps {
  user: User;
  currentLanguage: Language;
  onSave: (locationData: {
    cityId: string;
    areaId: string;
    areaName: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

export default function LocationSetupWizard({
  user,
  currentLanguage,
  onSave
}: LocationSetupWizardProps) {
  
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');

  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  useEffect(() => {
    async function loadCities() {
      const cityList = await dbGetCities();
      setCities(cityList);
      
      const rwp = cityList.find(c => c.name?.toLowerCase() === 'rawalpindi');
      if (rwp) {
        setSelectedCity(rwp.id);
      } else if (cityList.length > 0) {
        setSelectedCity(cityList[0].id);
      }
    }
    loadCities();
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    async function loadAreas() {
      const areaList = await dbGetAreas(selectedCity);
      setAreas(areaList);
      
      const dh = areaList.find(a => a.name?.toLowerCase() === 'dhoke hassu');
      if (dh) {
        setSelectedArea(dh.id);
      }
    }
    loadAreas();
  }, [selectedCity]);

  const handleDetectGPS = async () => {
    setLoadingGPS(true);
    setGpsError(null);
    setGpsSuccess(false);

    const coords = await detectBrowserLocation();
    if (coords) {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setGpsSuccess(true);
      
      if (selectedCity) {
        const nearest = await findNearestArea(coords.latitude, coords.longitude, selectedCity);
        if (nearest) {
          setSelectedArea(nearest.id);
        }
      }
    } else {
      setGpsError(
        currentLanguage === 'en'
          ? 'GPS permission denied or timed out. Please select your area manually.'
          : 'جی پی ایس کی اجازت نہیں ملی۔ براہ کرم اپنا علاقہ خود منتخب کریں۔'
      );
    }
    setLoadingGPS(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity || !selectedArea) {
      alert(currentLanguage === 'en' ? 'Please complete all location selections.' : 'براہ کرم تمام مقامات منتخب کریں۔');
      return;
    }

    const areaName = areas.find(a => a.id === selectedArea)?.name || 'Dhoke Hassu';

    onSave({
      cityId: selectedCity,
      areaId: selectedArea,
      areaName,
      latitude,
      longitude
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden p-6 animate-fade-in relative z-50">
        
        {/* Title / Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
            <Globe className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-tight">
            {currentLanguage === 'en' ? 'Configure Your Citizen Location' : 'اپنا رہائشی مقام سیٹ کریں'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 px-4 leading-relaxed font-semibold">
            {currentLanguage === 'en'
              ? 'Select your locality to customize your community feed, classifieds, and localized security alerts.'
              : 'اپنے علاقائی فیڈ، کلاسیفائیڈز اور سیکیورٹی الرٹس حاصل کرنے کے لیے اپنا مقام منتخب کریں۔'}
          </p>
        </div>

        {/* Detect GPS coordinates (Optional) */}
        <div className="mb-6 bg-slate-50 p-4 border border-slate-100 rounded-2xl flex flex-col items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              ⚡ {currentLanguage === 'en' ? 'GPS Auto-Detection (Optional)' : 'جی پی ایس آٹو فائنڈ (اختیاری)'}
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={loadingGPS}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black rounded-xl border border-slate-200 transition-all cursor-pointer ${
              loadingGPS ? 'bg-slate-200 text-slate-400' : 'bg-white hover:bg-slate-100/70 text-slate-700 shadow-xs'
            }`}
          >
            <Compass className={`w-4 h-4 text-blue-500 ${loadingGPS ? 'animate-spin' : ''}`} />
            <span>
              {loadingGPS
                ? (currentLanguage === 'en' ? 'Detecting...' : 'لوکیشن فائنڈ ہو رہی ہے...')
                : (currentLanguage === 'en' ? 'Detect Nearest Area via GPS' : 'جی پی ایس کے ذریعے مقام معلوم کریں')}
            </span>
          </button>

          {gpsSuccess && (
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>
                {currentLanguage === 'en'
                  ? `Location detected successfully! (${latitude?.toFixed(4)}, ${longitude?.toFixed(4)})`
                  : `کامیابی سے مقام کا پتہ چل گیا! (${latitude?.toFixed(4)}, ${longitude?.toFixed(4)})`}
              </span>
            </div>
          )}

          {gpsError && (
            <div className="text-[10px] text-red-500 font-bold text-center">
              {gpsError}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cascading dropdown selectors */}
          <div className="space-y-3.5">
            
            {/* City Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {currentLanguage === 'en' ? 'City' : 'شہر'}
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedArea('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold disabled:opacity-50"
              >
                <option value="" disabled>{currentLanguage === 'en' ? 'Select City' : 'شہر منتخب کریں'}</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Area Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                {currentLanguage === 'en' ? 'Area / Locality' : 'علاقہ / محلہ'}
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                disabled={!selectedCity}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-semibold disabled:opacity-50"
              >
                <option value="" disabled>{currentLanguage === 'en' ? 'Select Area' : 'علاقہ منتخب کریں'}</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={!selectedArea}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLanguage === 'en' ? 'Save Location & Continue' : 'مقام محفوظ کریں اور جاری رکھیں'}
          </button>
        </form>
      </div>
    </div>
  );
}
