import React from 'react';
import { motion } from 'framer-motion';

const SEED = '#AAD4B2';
const SHELL_LIGHT = '#E5B28D';
const SHELL_DARK = '#C79877';

const PistacheBase = ({ leftShellControls, rightShellControls, seedControls }) => (
  <svg
    viewBox="0 0 120 200"
    width="100%"
    height="100%"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    {/* Semilla (oculta detrás) */}
    <motion.g animate={seedControls}>
      <ellipse cx="60" cy="100" rx="22" ry="44" fill={SEED} />
    </motion.g>
    {/* Cáscara izquierda (clara) */}
    <motion.g
      animate={leftShellControls}
      style={{ originX: '60px', originY: '180px' }}
    >
      <g transform="translate(36, 55) scale(0.46)">
        <path
          d="M75.3318 182.492C68.5852 190.262 61.0022 194.821 53.193 195.8C45.3837 196.779 37.5662 194.153 30.3693 188.131C23.1724 182.109 16.7971 172.861 11.7562 161.129C6.71537 149.398 3.14973 135.512 1.34616 120.587C-0.457408 105.663 -0.448561 90.1168 1.37199 75.2002C3.19255 60.2836 6.77398 46.4127 11.8282 34.7035C16.8823 22.9943 23.2682 13.7737 30.4719 7.78351C37.6756 1.79328 45.4961 -0.799335 53.3043 0.214246L50 98L75.3318 182.492Z"
          fill={SHELL_LIGHT}
        />
      </g>
    </motion.g>
    {/* Cáscara derecha (oscura) */}
    <motion.g
      animate={rightShellControls}
      style={{ originX: '60px', originY: '180px' }}
    >
      <g transform="translate(43, 55) scale(0.46)">
        <path
          d="M0 167.296C5.81422 178.692 12.9726 187.102 20.8411 191.78C28.7096 196.458 37.0453 197.261 45.1099 194.117C53.1744 190.973 60.7189 183.979 67.075 173.755C73.4311 163.531 78.4027 150.392 81.5493 135.503C84.6959 120.614 85.9205 104.433 85.1146 88.3943C84.3086 72.3557 81.497 56.9543 76.9288 43.5541C72.3606 30.154 66.1768 19.1688 58.9252 11.5717C51.6735 3.9746 43.5779 1.21674e-06 35.3553 0L35.3553 98L0 167.296Z"
          fill={SHELL_DARK}
        />
      </g>
    </motion.g>
  </svg>
);

const PistacheIcon = ({ leftShellControls, rightShellControls, seedControls }) => (
  <div style={{ width: '100%', height: '100%' }}>
    <PistacheBase
      leftShellControls={leftShellControls}
      rightShellControls={rightShellControls}
      seedControls={seedControls}
    />
  </div>
);

export default PistacheIcon;
