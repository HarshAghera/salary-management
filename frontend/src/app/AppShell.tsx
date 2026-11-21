import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  ButtonBase,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Brand } from './Brand';
import { ColorModeToggle } from './ColorModeToggle';
import { NAV_ITEMS } from './navigation';

/** Horizontal padding shared by the top bar and the page, so their edges line up. */
const GUTTER = { xs: 2, sm: 3, lg: 5 };

/** Section tabs inside the top bar on large screens; the active one is underlined. */
function TopNavigation() {
  return (
    <Box component="nav" aria-label="Main" sx={{ display: 'flex', alignSelf: 'stretch', ml: 5 }}>
      {NAV_ITEMS.map((item) => (
        <ButtonBase
          key={item.path}
          component={NavLink}
          to={item.path}
          sx={{
            position: 'relative',
            px: 2.5,
            typography: 'button',
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.75)',
            transition: 'color 150ms',
            '&:hover': { color: '#fff' },
            '&.Mui-focusVisible': { outline: '2px solid #fff', outlineOffset: -6, borderRadius: 1 },
            '&.active': {
              color: '#fff',
              fontWeight: 600,
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 0,
                height: 3,
                borderRadius: '3px 3px 0 0',
                bgcolor: '#fff',
              },
            },
          }}
        >
          {item.label}
        </ButtonBase>
      ))}
    </Box>
  );
}

/** Vertical list inside the slide-out drawer on phones and tablets. */
function DrawerNavigation({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Box component="nav" aria-label="Main" sx={{ px: 1.5 }}>
      <List disablePadding sx={{ display: 'grid', gap: 0.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton key={item.path} component={NavLink} to={item.path} onClick={onNavigate}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

/**
 * Layout per docs/architecture.md: a solid top bar in the primary colour on every screen.
 * Desktops (lg and up) show the section tabs in it; phones and tablets get a menu button
 * that opens a slide-out drawer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Container maxWidth="xl" sx={{ px: GUTTER }}>
          <Toolbar disableGutters sx={{ gap: 1, minHeight: { lg: 72 } }}>
            {!isDesktop && (
              <IconButton edge="start" color="inherit" aria-label="Open navigation" onClick={() => setMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
            <Brand onColor />
            {isDesktop && <TopNavigation />}
            <Box sx={{ ml: 'auto' }}>
              <ColorModeToggle />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: '80%', maxWidth: 280 } }}
        >
          <Box sx={{ px: 2.5, pt: 2.5, pb: 3 }}>
            <Brand />
          </Box>
          <DrawerNavigation onNavigate={() => setMenuOpen(false)} />
        </Drawer>
      )}

      <Box component="main">
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4, lg: 5 }, px: GUTTER }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
