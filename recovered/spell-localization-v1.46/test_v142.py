import unittest,json,pathlib,re
P=pathlib.Path(__file__).parent
D=json.loads((P/'spell_delta_v142.json').read_text()); R=D['records']; N={r['name_en']:r for r in R}
EXPECTED=[('Grease',1,137),('Greater Invisibility',4,137),('Greater Restoration',5,137),('Guardian of Faith',4,137),('Guards and Wards',6,137),('Guidance',0,138),('Guiding Bolt',1,138),('Gust of Wind',2,138),('Hallow',5,138),('Hallucinatory Terrain',4,139),('Harm',6,139),('Haste',3,139)]
class Delta(unittest.TestCase):
 def test_order(self): self.assertEqual([(r['name_en'],r['level'],r['source']['printed_pages'][0]) for r in R],EXPECTED)
 def test_ordinals(self): self.assertEqual([r['ordinal'] for r in R],list(range(145,157)))
 def test_unique(self): self.assertEqual(len(N),12)
 def test_release(self): self.assertTrue(all(r['release_status']=='NO_GO' and r['editorial_status']=='PENDING' and r['integration_status']=='NOT_VERIFIED' for r in R));self.assertFalse(D['parent_merge_verified'])
 def test_components(self):
  for r in R:
   self.assertEqual('M' in r['components'],r['material'] is not None)
   self.assertTrue(set(r['components'])<=set('VSM'))
 def test_concentration(self): self.assertEqual({r['name_en'] for r in R if r['concentration']},{'Greater Invisibility','Guidance','Gust of Wind','Haste'})
 def test_material(self): self.assertEqual({r['name_en']:r['material']['minimum_gp'] for r in R if r['material'] and r['material']['minimum_gp']},{'Greater Restoration':100,'Guards and Wards':10,'Hallow':1000});self.assertEqual({r['name_en'] for r in R if r['material'] and r['material']['consumed']},{'Greater Restoration','Hallow'})
 def test_license(self): self.assertIn('creativecommons.org/licenses/by/4.0/legalcode',D['attribution']);self.assertIn(D['attribution'],(P/'SPELL_LOCALIZATION_v142.md').read_text())
 def test_markdown_consistency(self):
  md=(P/'SPELL_LOCALIZATION_v142.md').read_text()
  for r in R: self.assertIn(f"## {r['ordinal']}. {r['name_en']}",md);self.assertIn(r['description_id'],md)
 def test_checks_nonempty(self): self.assertTrue(all(isinstance(r['reference_checks'],dict) and r['reference_checks'] for r in R))
 def test_grease(self): self.assertEqual(N['Grease']['reference_checks']['triggers'],['appearance_standing','enter','end_turn']);self.assertFalse(N['Grease']['reference_checks']['flammable'])
 def test_invisibility(self): self.assertEqual(N['Greater Invisibility']['reference_checks']['condition_ends'],'spell_end')
 def test_restoration(self): self.assertEqual(N['Greater Restoration']['reference_checks']['remove_effect_count'],1)
 def test_guardian(self):
  c=N['Guardian of Faith']['reference_checks'];self.assertEqual((c['failed_damage'],c['success_damage'],c['vanish_total_damage']),(20,10,60))
 def test_wards(self):
  c=N['Guards and Wards']['reference_checks'];self.assertTrue(all(l['count']*l['side_ft']**2==2500 for l in c['layouts']));self.assertEqual(c['daily_casts_for_persistence'],365);self.assertFalse(c['dispel_direct'])
 def test_guidance(self): self.assertFalse(N['Guidance']['reference_checks']['once_only']);self.assertEqual(N['Guidance']['reference_checks']['skill_count'],1)
 def test_bolt(self): self.assertEqual(N['Guiding Bolt']['reference_checks']['advantage_deadline'],'before_end_of_caster_next_turn')
 def test_gust(self): self.assertEqual(N['Gust of Wind']['reference_checks']['toward_caster_movement_cost_multiplier'],2)
 def test_hallow(self):
  c=N['Hallow']['reference_checks'];self.assertEqual(len(c['extra_options']),10);self.assertEqual(len(c['ward_types']),6);self.assertTrue(c['fails_on_overlap'])
 def test_terrain(self): self.assertTrue(N['Hallucinatory Terrain']['reference_checks']['touch_unchanged'])
 def test_harm(self):
  c=N['Harm']['reference_checks'];self.assertEqual(c['hp_max_floor'],1);self.assertFalse(c['success_hp_max_reduction'])
 def test_haste(self):
  c=N['Haste']['reference_checks'];self.assertEqual(c['extra_attack_limit'],1);self.assertEqual(c['end_condition'],'Incapacitated');self.assertEqual(c['end_speed'],0)
if __name__=='__main__':unittest.main(verbosity=2)
