import React from 'react';
import { VideoPlayer } from '../common/VideoPlayer';

const VIDEO_DEMOS = [
  {
    title: "Real-Time Facial Recognition at Airport Security",
    description: "Watch how SSSP compares passengers against watchlists to flag possible identity fraud despite fake passports.",
    videoPlaceholder: "[Demo: Airport Face Recognition - Video Coming Soon]",
    mp4Url: "/videos/godseye.mp4"
  },
  {
    title: "Abnormal Behavior Detection in Smart City",
    description: "See how behavior analytics can highlight suspicious loitering, aggression patterns, and evasive movements.",
    videoPlaceholder: "[Demo: Behavior Analysis - Video Coming Soon]"
  },
  {
    title: "Geofencing Breach Alert",
    description: "Real-time alerts when unauthorized individuals enter restricted zones .",
    videoPlaceholder: "[Demo: Geofencing - Video Coming Soon]"
  },
  {
    title: "AQI Monitoring & Health Alerts",
    description: "IoT air quality tracking with forecasting and recommendation features (when enabled).",
    videoPlaceholder: "[Demo: Environmental AI - Video Coming Soon]"
  },
  {
    title: "Crowd Analytics & Safety",
    description: "Crowd insights and safety monitoring (optional module) for large gatherings.",
    videoPlaceholder: "[Demo: Crowd Management - Video Coming Soon]"
  }
];

export const VideoDemoSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">See SSSP In Action</h2>
          <p className="text-xl text-slate-300">Demo scenarios for key modules</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {VIDEO_DEMOS.slice(0, 2).map((video, i) => (
            <VideoPlayer key={i} {...video} />
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {VIDEO_DEMOS.slice(2).map((video, i) => (
            <VideoPlayer key={i} {...video} />
          ))}
        </div>
      </div>
    </section>
  );
};