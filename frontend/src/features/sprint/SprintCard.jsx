import React, { useState, useEffect, useCallback } from 'react';
import { timelineRepository } from '../../data/repositories/timelineRepository';
import {
  buildSprintCollageUrls,
  filterPhotoDatesInSprintRange,
  FALLBACK_COLLAGE_IMAGES,
} from './utils/sprintCollagePhotos';

function CollageSlot({ src, alt, className, fallbackIndex }) {
  const fb =
    FALLBACK_COLLAGE_IMAGES[fallbackIndex % FALLBACK_COLLAGE_IMAGES.length];
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  const onError = useCallback(() => {
    setCurrent((prev) => (prev !== fb ? fb : prev));
  }, [fb]);

  return (
    <img src={current} alt={alt} className={className} onError={onError} loading="lazy" />
  );
}

const SprintCard = ({ sprint, projectId, onClick }) => {
  const [collageUrls, setCollageUrls] = useState(() => buildSprintCollageUrls(projectId, sprint, []));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!projectId) {
        setCollageUrls(buildSprintCollageUrls(0, sprint, []));
        return;
      }
      try {
        const allDates = await timelineRepository.getPhotoDates(projectId);
        if (cancelled) return;
        const inRange = filterPhotoDatesInSprintRange(
          allDates,
          sprint?.startDate,
          sprint?.endDate
        );
        setCollageUrls(buildSprintCollageUrls(projectId, sprint, inRange));
      } catch {
        if (!cancelled) {
          setCollageUrls(buildSprintCollageUrls(projectId, sprint, []));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, sprint?.id, sprint?.startDate, sprint?.endDate]);

  const [u0, u1, u2, u3] = collageUrls;

  return (
    <div
      onClick={() => onClick(sprint.id)}
      className="group flex cursor-pointer flex-col items-center transition-all"
    >
      <h3 className="mb-6 text-2xl font-bold text-slate-800 transition-colors group-hover:text-[#446E51]">
        {sprint.name}
      </h3>

      <div className="relative flex h-[320px] w-[450px] flex-col gap-4 overflow-hidden rounded-[32px] border-[6px] border-[#446E51] bg-white p-8 shadow-xl transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
        <div className="flex h-full gap-4">
          {/* Columna izquierda (mini barra tipo sidebar) */}
          <div className="flex w-1/4 flex-col gap-2 overflow-hidden rounded-xl bg-gray-100 p-3">
            <CollageSlot
              src={u0}
              alt=""
              fallbackIndex={(Number(sprint.id) || 0) * 2}
              className="h-6 w-full rounded-md object-cover grayscale opacity-80"
            />
            <div className="h-4 w-3/4 rounded-md bg-gray-200" />
            <div className="h-4 w-1/2 rounded-md bg-gray-200" />
          </div>

          {/* Área principal */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex min-h-0 h-1/3 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <CollageSlot
                src={u1}
                alt=""
                fallbackIndex={(Number(sprint.id) || 0) * 2 + 1}
                className="h-12 w-12 shrink-0 rounded-lg object-cover grayscale opacity-90"
              />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-3 w-3/4 rounded-full bg-gray-200" />
                <div className="h-2 w-1/2 rounded-full bg-gray-200" />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <CollageSlot
                  src={u2}
                  alt=""
                  fallbackIndex={(Number(sprint.id) || 0) + 3}
                  className="min-h-0 w-full flex-1 object-cover grayscale opacity-85"
                />
                <div className="h-10 shrink-0 space-y-1 p-2">
                  <div className="h-2 w-full rounded-full bg-gray-300" />
                  <div className="h-2 w-2/3 rounded-full bg-gray-300" />
                </div>
              </div>
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <CollageSlot
                  src={u3}
                  alt=""
                  fallbackIndex={(Number(sprint.id) || 0) + 5}
                  className="min-h-0 w-full flex-1 object-cover grayscale opacity-85"
                />
                <div className="h-10 shrink-0 p-2">
                  <div className="h-2 w-full rounded-full bg-gray-300" />
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
