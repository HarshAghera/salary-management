import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

/** Switches between light and dark. Until the user chooses, the device setting applies. */
export function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) {
    // The mode is only known after mount; rendering nothing avoids a flash of the wrong icon.
    return null;
  }

  const current = mode === 'system' ? systemMode : mode;
  const next = current === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={() => setMode(next)} color="inherit">
        {next === 'dark' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
