import { Template } from "@/services/templateService";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CapturedPhoto {
  slotIndex: number;
  dataUrl: string;
  capturedAt: number;
}

export interface CapturedVideo {
  slotIndex: number;
  videoBlob: Blob;
  recordedAt: number;
}

interface PhotoState {
  captures: CapturedPhoto[];
  capturesVideo: CapturedVideo[];
  template: Template | null;
  totalSlots: number;
  templateWithPhoto: any
  templateWithVideo: any
  capturesToGIF: any

  addCapture: (photo: CapturedPhoto) => void;
  addVideoCapture: (video: CapturedVideo) => void;
  setTemplate: (template: Template) => void;
  retakeSlot: (slotIndex: number) => void;
  retakeVideoSlot: (slotIndex: number) => void;
  setTotalSlots: (count: number) => void;
  setTemplateWithPhoto: (data: any) => void;
  setTemplateWithVideo: (data: any) => void;
  setCapturesToGIF: (data: any) => void;
  clearPhotos: () => void;
  isComplete: () => boolean;
}
export const usePhotoStore = create<PhotoState>()(
  persist(
    (set, get) => ({
      captures: [],
      capturesVideo: [],
      template: null,
      totalSlots: 1,
      templateWithPhoto: null,
      templateWithVideo: null,
      capturesToGIF: null,

      addCapture: (photo) => {
        set((s) => ({ captures: [...s.captures, photo] }));
      },

      addVideoCapture: (video) => {
        set((s) => ({ capturesVideo: [...s.capturesVideo, video] }));
      },

      setTemplate: (template) => {
        set({ template });
      },

      retakeSlot: (slotIndex) => {
        set((s) => ({
          captures: s.captures.filter((c) => c.slotIndex !== slotIndex),
        }));
      },

      retakeVideoSlot: (slotIndex) => {
        set((s) => ({
          capturesVideo: s.capturesVideo.filter(
            (v) => v.slotIndex !== slotIndex,
          ),
        }));
      },

      setTotalSlots: (count) => {
        set({ totalSlots: count });
      },

      setTemplateWithPhoto(data) {
        set({ templateWithPhoto: data })
      },

      setTemplateWithVideo(data) {
        set({ templateWithPhoto: data })
      },

      setCapturesToGIF(data) {
        set({ templateWithPhoto: data })
      },

      clearPhotos: () => {
        set({ captures: [], capturesVideo: [] });
      },

      isComplete: () => {
        const { captures, totalSlots } = get();
        return captures.length >= totalSlots;
      },
    }),
    {
      name: "retroppies-captures",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        captures: s.captures,
        capturesVideo: s.capturesVideo,
        template: s.template,
        totalSlots: s.totalSlots,
      }),
    },
  ),
);

// export const usePhotoStore = create<PhotoState>(
//   persist(
//     (set, get) => ({
//       captures: [],
//       capturesVideo: [],
//       template: null,
//       totalSlots: 4,

//       addCapture: (photo) => {
//         const { captures } = get();
//         const updated = captures.filter((c) => c.slotIndex !== photo.slotIndex);
//         set({ captures: [...updated, photo] });
//       },

//       setTemplate: (template) => {
//         set({ template });
//       },

//       addVideoCapture: (video) => {
//         const { capturesVideo } = get();
//         const updated = capturesVideo.filter(
//           (v) => v.slotIndex !== video.slotIndex,
//         );
//         set({ capturesVideo: [...updated, video] });
//       },

//       retakeSlot: (slotIndex) => {
//         set((s) => ({
//           captures: s.captures.filter((c) => c.slotIndex !== slotIndex),
//         }));
//       },

//       retakeVideoSlot: (slotIndex) => {
//         set((s) => ({
//           capturesVideo: s.capturesVideo.filter(
//             (v) => v.slotIndex !== slotIndex,
//           ),
//         }));
//       },

//       setTotalSlots: (count) => set({ totalSlots: count }),

//       clearPhotos: () => set({ captures: [], capturesVideo: [] }),

//       isComplete: () => {
//         const { captures, totalSlots } = get();
//         return captures.length >= totalSlots;
//       }
//     }),
//     {
//       name: "retroppies-captures",
//       storage: createJSONStorage(() => sessionStorage),
//       partialize: (s) => ({
//         captures: s.captures,
//         capturesVideo: s.capturesVideo,
//         template: s.template,
//         totalSlots: s.totalSlots,
//       }),
//     },
//   ),
// );
