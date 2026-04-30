import { TopBar } from "@/components/TopBar";
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

  return (
    <TopBar
      song={song}
      isLoading={status === "loading"}
      previewEnabled={previewEnabled}
      selectedBarLength={selectedBarLength}
      onLoadClick={onLoadClick}
      onPreviewChange={(enabled) => dispatch(setPreviewEnabled(enabled))}
      onBarLengthChange={(value) => dispatch(setSelectedBarLength(value))}
    />
  );
}
