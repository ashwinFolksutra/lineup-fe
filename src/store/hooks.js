import { useDispatch, useSelector } from 'react-redux';

// Custom hooks for Redux
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Specific selectors for common use cases
export const useTracksData = () => useSelector(state => state.tracks);
export const useClipSelection = () => useSelector(state => state.clipSelection);
export const useActiveClipContext = () => useSelector(state => state.clipSelection.activeClipContext);
export const useSelectedClips = () => useSelector(state => new Set(state.clipSelection.selectedClips)); 