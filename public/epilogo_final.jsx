// components/EpilogoFinal.tsx
import { motion } from 'framer-motion';
import React from 'react';

interface EpilogoFinalProps {
  mostrar: boolean;
  frase: string | null;
  onFechar: () => void;
  encerrado: boolean;
}

const EpilogoFinal: React.FC<EpilogoFinalProps> = ({ mostrar, frase, onFechar, encerrado }) => {
  if (!mostrar && !encerrado) return null;

  return (
    <>
      {mostrar && !encerrado && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.img
            src="/einstein_final.png"
            alt="Einstein Final"
            className="w-28 sm:w-40 mb-4"
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 10 }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Albert_Einstein_Head.jpg/480px-Albert_Einstein_Head.jpg';
            }}
          />
          <motion.div
            className="speech-bubble active cursor-pointer max-w-xl text-base sm:text-lg bg-yellow-100 border border-black p-3"
            onClick={onFechar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {frase}
          </motion.div>
        </motion.div>
      )}

      {encerrado && (
        <motion.div
          className="fixed inset-0 bg-white z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
      )}
    </>
  );
};

export default EpilogoFinal;
