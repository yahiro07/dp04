import { TopBar } from "@/components/TopBar";
import { createTopBarViewModel } from "@/lib/view-model-support";
import { setPreviewEnabled, setSelectedBarLength } from "@/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface TopBarContainerProps {
  onLoadClick: () => void;
}

export function TopBarContainer(props: TopBarContainerProps) {
  const { onLoadClick } = props;
  const dispatch = useAppDispatch();
  const { previewEnabled, selectedBarLength, song, status } = useAppSelector(
    (state) => state.app,
  );
  const viewModel = createTopBarViewModel({
    song,
    isLoading: status === "loading",
    previewEnabled,
    selectedBarLength,
  });

  return (
    <TopBar
      viewModel={viewModel}
      onLoadClick={onLoadClick}
      onPreviewChange={(enabled) => dispatch(setPreviewEnabled(enabled))}
      onBarLengthChange={(value) => dispatch(setSelectedBarLength(value))}
    />
  );
}
