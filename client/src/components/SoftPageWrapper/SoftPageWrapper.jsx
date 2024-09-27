import { motion } from 'framer-motion';

const softTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] } },
};

const SoftPageWrapper = ({ children }) => (
  <motion.div
    variants={softTransition}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ position: 'absolute', width: '100%' }}
  >
    {children}
  </motion.div>
);

export default SoftPageWrapper;