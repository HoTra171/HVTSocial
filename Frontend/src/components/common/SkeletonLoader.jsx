import React from 'react';

export const PostSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1.5">
          <div className="w-28 h-3.5 bg-gray-200 rounded" />
          <div className="w-16 h-2.5 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-3 bg-gray-100 rounded" />
        <div className="w-4/5 h-3 bg-gray-100 rounded" />
        <div className="w-2/3 h-3 bg-gray-100 rounded" />
      </div>

      {/* Media Placeholder Skeleton */}
      <div className="w-full h-64 bg-gray-200 rounded-xl mb-3" />

      {/* Actions Skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="w-16 h-6 bg-gray-100 rounded-lg" />
        <div className="w-16 h-6 bg-gray-100 rounded-lg" />
        <div className="w-16 h-6 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
};

export const StorySkeleton = () => {
  return (
    <div className="w-20 h-28 rounded-2xl bg-gray-200 animate-pulse flex-shrink-0 relative overflow-hidden">
      <div className="w-8 h-8 rounded-full bg-gray-300 absolute top-2 left-2" />
      <div className="w-12 h-2.5 bg-gray-300 rounded absolute bottom-2 left-2" />
    </div>
  );
};

export const UserCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="space-y-1.5">
          <div className="w-32 h-3.5 bg-gray-200 rounded" />
          <div className="w-20 h-2.5 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded-xl" />
    </div>
  );
};

export default PostSkeleton;
