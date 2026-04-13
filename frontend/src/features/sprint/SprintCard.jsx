import React from 'react';

const SprintCard = ({ sprint, onClick }) => {
  return (
    <div 
      onClick={() => onClick(sprint.id)}
      className="flex flex-col items-center cursor-pointer group transition-all"
    >
      <h3 className="text-2xl font-bold text-slate-800 mb-6 group-hover:text-[#67BFA1] transition-colors">
        {sprint.name}
      </h3>
      
      <div className="w-[450px] h-[320px] border-[6px] border-[#67BFA1] rounded-[32px] bg-white shadow-xl p-8 flex flex-col gap-4 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all overflow-hidden relative">
        {/* Simulated UI Content */}
        <div className="flex gap-4 h-full">
          {/* Left Column / Sidebar area */}
          <div className="w-1/4 bg-gray-100 rounded-xl flex flex-col gap-2 p-3 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&q=80&w=200" alt="sidebar header" className="h-6 w-full rounded-md object-cover grayscale opacity-60" />
             <div className="h-4 w-3/4 bg-gray-200 rounded-md"></div>
             <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
          </div>

          {/* Main Area with "Images" / Task blocks */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-1/3 bg-gray-50 border border-gray-100 rounded-xl p-3 flex gap-3 min-h-0">
               <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="avatar" className="w-12 h-12 rounded-lg shrink-0 object-cover grayscale" />
               <div className="flex-1 flex flex-col gap-2 justify-center">
                  <div className="h-3 w-3/4 bg-gray-200 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-gray-200 rounded-full"></div>
               </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 overflow-hidden">
               <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                  <img 
                    src={`https://picsum.photos/seed/${sprint.id + 10}/200/120`} 
                    alt="Task preview" 
                    className="flex-1 w-full object-cover grayscale opacity-80 min-h-0"
                  />
                  <div className="p-2 space-y-1 h-10 shrink-0">
                     <div className="h-2 w-full bg-gray-300 rounded-full"></div>
                     <div className="h-2 w-2/3 bg-gray-300 rounded-full"></div>
                  </div>
               </div>
               <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex flex-col">
                  <img 
                    src={`https://picsum.photos/seed/${sprint.id + 20}/200/150`} 
                    alt="Task preview" 
                    className="flex-1 w-full object-cover grayscale opacity-80 min-h-0"
                  />
                  <div className="p-2 h-10 shrink-0">
                     <div className="h-2 w-full bg-gray-300 rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintCard;
